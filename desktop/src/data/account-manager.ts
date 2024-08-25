import * as fs from 'node:fs';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { WorkspaceManager } from '@/data/workspace-manager';
import { SocketManager } from '@/data/socket-manager';
import { ServerMutation } from '@/types/mutations';

export class AccountManager {
  private readonly accountPath: string;
  private readonly socket: SocketManager;
  private readonly workspaces: Map<string, WorkspaceManager>;
  private interval: NodeJS.Timeout;

  constructor(account: Account, appPath: string, workspaces: Workspace[]) {
    this.socket = new SocketManager(account);
    this.workspaces = new Map<string, WorkspaceManager>();

    this.accountPath = `${appPath}/${account.id}`;
    if (!fs.existsSync(this.accountPath)) {
      fs.mkdirSync(this.accountPath);
    }

    for (const workspace of workspaces) {
      this.workspaces.set(
        workspace.id,
        new WorkspaceManager(account, workspace, this.accountPath),
      );
    }

    this.socket.on('mutation', async (mutation) => {
      const serverMutation = mutation as ServerMutation;
      const workspace = this.workspaces.get(serverMutation.workspaceId);
      if (workspace) {
        await workspace.executeServerMutation(serverMutation);
        this.socket.send({
          type: 'mutation_ack',
          payload: {
            id: serverMutation.id,
            workspaceId: serverMutation.workspaceId,
          },
        });
      }
    });
  }

  public async init() {
    for (const workspace of this.workspaces.values()) {
      await workspace.init();
    }

    this.socket.init();
    this.startEventLoop();
  }

  public getWorkspace(workspaceId: string): WorkspaceManager | undefined {
    return this.workspaces.get(workspaceId);
  }

  public async logout(): Promise<void> {
    if (fs.existsSync(this.accountPath)) {
      fs.rm(this.accountPath, { recursive: true, force: true }, (err) => {
        if (err) {
          console.error('Error deleting account directory: ', err);
        }
      });
    }

    if (this.socket) {
      this.socket.close();
    }

    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private startEventLoop() {
    this.interval = setInterval(async () => {
      try {
        await this.executeEventLoop();
      } catch (error) {
        console.error('Error in event loop: ', error);
      }
    }, 1000);
  }

  private async executeEventLoop() {
    this.socket.checkConnection();

    for (const workspace of this.workspaces.values()) {
      await workspace.sendMutations();
    }
  }
}
