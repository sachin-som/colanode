import * as fs from 'node:fs';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { WorkspaceManager } from '@/data/workspace-manager';
import { SocketManager } from '@/data/socket-manager';

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
  }

  public async init() {
    for (const workspace of this.workspaces.values()) {
      await workspace.init();
    }

    this.socket.init();
    this.socket.on('transaction_ack', async (payload) => {
      const transactionId = payload.id;
      const workspaceId = payload.workspaceId;

      if (!this.workspaces.has(workspaceId)) {
        return;
      }

      const workspace = this.workspaces.get(workspaceId);
      await workspace?.acknowledgeTransaction(transactionId);
    });

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
    }, 15);
  }

  private async executeEventLoop() {
    this.socket.checkConnection();

    if (!this.socket.isConnected()) {
      return;
    }

    for (const workspace of this.workspaces.values()) {
      const transactions = await workspace.getTransactions();
      if (transactions.length === 0) {
        continue;
      }

      for (const transaction of transactions) {
        this.socket.send({
          type: 'transaction',
          payload: transaction,
        });
      }
    }
  }
}
