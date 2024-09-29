import * as fs from 'node:fs';
import Axios, { AxiosInstance } from 'axios';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { WorkspaceManager } from '@/electron/workspace-manager';
import { SocketManager } from '@/electron/socket-manager';
import { ServerMutation } from '@/types/mutations';
import { Kysely } from 'kysely';
import { AppDatabaseSchema } from '@/electron/schemas/app';
import { Server } from '@/types/servers';
import { buildApiBaseUrl } from '@/lib/servers';

export class AccountManager {
  public readonly account: Account;
  private readonly accountPath: string;
  private readonly socket: SocketManager;
  private readonly axios: AxiosInstance;
  private readonly workspaces: Map<string, WorkspaceManager>;
  private readonly database: Kysely<AppDatabaseSchema>;

  constructor(
    server: Server,
    account: Account,
    appPath: string,
    workspaces: Workspace[],
    database: Kysely<AppDatabaseSchema>,
  ) {
    this.account = account;
    this.database = database;
    this.socket = new SocketManager(server, account);
    this.axios = Axios.create({
      baseURL: buildApiBaseUrl(server),
      headers: {
        Authorization: `Bearer ${account.token}`,
        DeviceId: account.deviceId,
      },
    });

    this.workspaces = new Map<string, WorkspaceManager>();
    this.accountPath = `${appPath}/${account.id}`;
    if (!fs.existsSync(this.accountPath)) {
      fs.mkdirSync(this.accountPath);
    }

    for (const workspace of workspaces) {
      this.workspaces.set(
        workspace.id,
        new WorkspaceManager(workspace, this.axios, this.accountPath),
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

  public async init(): Promise<void> {
    for (const workspace of this.workspaces.values()) {
      await workspace.init();
    }
  }

  public getWorkspace(workspaceId: string): WorkspaceManager | undefined {
    return this.workspaces.get(workspaceId);
  }

  public async addWorkspace(workspace: Workspace): Promise<void> {
    const workspaceManager = new WorkspaceManager(
      workspace,
      this.axios,
      this.accountPath,
    );

    await workspaceManager.init();
    this.workspaces.set(workspace.id, workspaceManager);
  }

  public async logout(): Promise<boolean> {
    const { status } = await this.axios.delete(
      `v1/accounts/logout/${this.account.deviceId}`,
    );

    if (status !== 200) {
      return false;
    }

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

    return true;
  }

  public async executeEventLoop(): Promise<void> {
    this.socket.checkConnection();
    for (const workspace of this.workspaces.values()) {
      if (!workspace.isSynced()) {
        const synced = await workspace.sync();
        if (synced) {
          await this.database
            .updateTable('workspaces')
            .set({ synced: 1 })
            .where('id', '=', workspace.getWorkspace().id)
            .execute();
        }
      }
      await workspace.sendMutations();
    }
  }
}
