import { BackoffCalculator } from '@/lib/backoff-calculator';
import { buildAxiosInstance } from '@/lib/servers';
import { databaseManager } from '@/main/data/database-manager';
import { ServerSyncResponse } from '@/types/sync';
import { WorkspaceCredentials } from '@/types/workspaces';
import { fileManager } from './file-manager';

const EVENT_LOOP_INTERVAL = 1000;

class Synchronizer {
  private initiated: boolean = false;
  private readonly backoffs: Map<string, BackoffCalculator> = new Map();

  constructor() {
    this.executeEventLoop = this.executeEventLoop.bind(this);
  }

  public init() {
    if (this.initiated) {
      return;
    }

    setTimeout(this.executeEventLoop, 10);
    this.initiated = true;
  }

  private async executeEventLoop() {
    try {
      await this.syncLoggedOutAccounts();
      await this.syncWorkspaces();
    } catch (error) {
      console.log('error', error);
    }

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async syncLoggedOutAccounts() {
    const accounts = await databaseManager.appDatabase
      .selectFrom('accounts')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'accounts.id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .where('status', '=', 'logged_out')
      .execute();

    if (accounts.length === 0) {
      return;
    }

    for (const account of accounts) {
      const backoffKey = account.id;
      if (this.backoffs.has(backoffKey)) {
        const backoff = this.backoffs.get(backoffKey);
        if (!backoff.canRetry()) {
          return;
        }
      }

      try {
        const axios = buildAxiosInstance(
          account.domain,
          account.attributes,
          account.token,
        );

        const { status } = await axios.delete(`/v1/accounts/logout`);

        if (status !== 200) {
          return;
        }

        await databaseManager.deleteAccountData(account.id);
        await databaseManager.appDatabase
          .deleteFrom('accounts')
          .where('id', '=', account.id)
          .execute();

        if (this.backoffs.has(backoffKey)) {
          this.backoffs.delete(backoffKey);
        }
      } catch (error) {
        if (!this.backoffs.has(backoffKey)) {
          this.backoffs.set(backoffKey, new BackoffCalculator());
        }

        const backoff = this.backoffs.get(account.id);
        backoff.increaseError();
      }
    }
  }

  private async syncWorkspaces() {
    const workspaces = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'workspaces.workspace_id',
        'workspaces.user_id',
        'workspaces.account_id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .execute();

    for (const workspace of workspaces) {
      const backoffKey = workspace.user_id;
      if (this.backoffs.has(backoffKey)) {
        const backoff = this.backoffs.get(backoffKey);
        if (!backoff.canRetry()) {
          return;
        }
      }

      const credentials: WorkspaceCredentials = {
        workspaceId: workspace.workspace_id,
        accountId: workspace.account_id,
        userId: workspace.user_id,
        token: workspace.token,
        serverDomain: workspace.domain,
        serverAttributes: workspace.attributes,
      };

      try {
        await this.checkForChanges(credentials);
        // await fileManager.checkForUploads(credentials);

        if (this.backoffs.has(backoffKey)) {
          this.backoffs.delete(backoffKey);
        }
      } catch (error) {
        console.log('error', error);
        if (!this.backoffs.has(backoffKey)) {
          this.backoffs.set(backoffKey, new BackoffCalculator());
        }

        const backoff = this.backoffs.get(backoffKey);
        backoff.increaseError();
      }
    }
  }

  private async checkForChanges(credentials: WorkspaceCredentials) {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      credentials.userId,
    );

    const changes = await workspaceDatabase
      .selectFrom('changes')
      .selectAll()
      .orderBy('id asc')
      .limit(20)
      .execute();

    if (changes.length === 0) {
      return;
    }

    const axios = buildAxiosInstance(
      credentials.serverDomain,
      credentials.serverAttributes,
      credentials.token,
    );

    const { data } = await axios.post<ServerSyncResponse>(
      `/v1/sync/${credentials.workspaceId}`,
      {
        changes: changes,
      },
    );

    const syncedChangeIds: number[] = [];
    const unsyncedChangeIds: number[] = [];
    for (const result of data.results) {
      if (result.status === 'success') {
        syncedChangeIds.push(result.id);
      } else {
        unsyncedChangeIds.push(result.id);
      }
    }

    if (syncedChangeIds.length > 0) {
      await workspaceDatabase
        .deleteFrom('changes')
        .where('id', 'in', syncedChangeIds)
        .execute();
    }

    if (unsyncedChangeIds.length > 0) {
      await workspaceDatabase
        .updateTable('changes')
        .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
        .where('id', 'in', unsyncedChangeIds)
        .execute();

      //we just delete changes that have failed to sync for more than 5 times.
      //in the future we might need to revert the change locally.
      await workspaceDatabase
        .deleteFrom('changes')
        .where('retry_count', '>=', 5)
        .execute();
    }
  }
}

export const synchronizer = new Synchronizer();
