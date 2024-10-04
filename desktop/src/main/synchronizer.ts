import axios from 'axios';
import { buildApiBaseUrl } from '@/lib/servers';
import { SelectWorkspace } from '@/main/data/app/schema';
import { databaseContext } from '@/main/data/database-context';
import { WorkspaceSyncData } from '@/types/sync';

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
    await this.checkForWorkspaceSyncs();

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async checkForWorkspaceSyncs(): Promise<void> {
    const unsyncedWorkspaces = await databaseContext.appDatabase
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

  private async syncWorkspace(workspace: SelectWorkspace): Promise<void> {
    const account = await databaseContext.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', workspace.account_id)
      .executeTakeFirst();

    if (!account) {
      return;
    }

    const server = await databaseContext.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      return;
    }

    const { data } = await axios.get<WorkspaceSyncData>(
      `${buildApiBaseUrl(server)}/v1/sync/${workspace.workspace_id}`,
      {
        headers: {
          Authorization: `Bearer ${account.token}`,
        },
      },
    );

    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
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

    await databaseContext.appDatabase
      .updateTable('workspaces')
      .set({
        synced: 1,
      })
      .where('user_id', '=', workspace.user_id)
      .execute();
  }
}

export const synchronizer = new Synchronizer();
