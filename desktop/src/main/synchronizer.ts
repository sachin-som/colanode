import { buildAxiosInstance } from '@/lib/servers';
import { SelectWorkspace } from '@/main/data/app/schema';
import { databaseManager } from '@/main/data/database-manager';
import { ServerSyncResponse, WorkspaceSyncData } from '@/types/sync';

const EVENT_LOOP_INTERVAL = 100;

class Synchronizer {
  private initiated: boolean = false;

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
    // try {
    await this.checkForWorkspaceSyncs();
    await this.checkForWorkspaceChanges();
    // } catch (error) {
    //   console.log('error', error);
    // }

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async checkForWorkspaceSyncs(): Promise<void> {
    const unsyncedWorkspaces = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('synced', '=', 0)
      .execute();

    if (unsyncedWorkspaces.length === 0) {
      return;
    }

    for (const workspace of unsyncedWorkspaces) {
      await this.syncWorkspace(workspace);
    }
  }

  private async checkForWorkspaceChanges() {
    const workspaces = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'workspaces.workspace_id',
        'workspaces.user_id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .where('workspaces.synced', '=', 1)
      .execute();

    for (const workspace of workspaces) {
      const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
        workspace.user_id,
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
        workspace.domain,
        workspace.attributes,
        workspace.token,
      );

      const { data } = await axios.post<ServerSyncResponse>(
        `/v1/sync/${workspace.workspace_id}`,
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

  private async syncWorkspace(workspace: SelectWorkspace): Promise<void> {
    const credentials = await databaseManager.appDatabase
      .selectFrom('accounts')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select(['domain', 'attributes', 'token'])
      .where('id', '=', workspace.account_id)
      .executeTakeFirst();

    if (!credentials) {
      return;
    }

    const axios = buildAxiosInstance(
      credentials.domain,
      credentials.attributes,
      credentials.token,
    );
    const { data } = await axios.get<WorkspaceSyncData>(
      `/v1/sync/${workspace.workspace_id}`,
    );

    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      workspace.user_id,
    );

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx.deleteFrom('nodes').execute();
      await trx.deleteFrom('node_reactions').execute();
      await trx.deleteFrom('node_collaborators').execute();

      if (data.nodes.length > 0) {
        await trx
          .insertInto('nodes')
          .values(
            data.nodes.map((node) => {
              return {
                id: node.id,
                attributes: JSON.stringify(node.attributes),
                state: node.state,
                created_at: node.createdAt,
                created_by: node.createdBy,
                updated_at: node.updatedAt,
                updated_by: node.updatedBy,
                version_id: node.versionId,
                server_created_at: node.serverCreatedAt,
                server_updated_at: node.serverUpdatedAt,
                server_version_id: node.versionId,
              };
            }),
          )
          .execute();
      }

      if (data.nodeReactions.length > 0) {
        await trx
          .insertInto('node_reactions')
          .values(
            data.nodeReactions.map((nodeReaction) => {
              return {
                node_id: nodeReaction.nodeId,
                actor_id: nodeReaction.actorId,
                reaction: nodeReaction.reaction,
                created_at: nodeReaction.createdAt,
                server_created_at: nodeReaction.serverCreatedAt,
              };
            }),
          )
          .execute();
      }
    });

    await databaseManager.appDatabase
      .updateTable('workspaces')
      .set({
        synced: 1,
      })
      .where('user_id', '=', workspace.user_id)
      .execute();
  }
}

export const synchronizer = new Synchronizer();
