import { databaseService } from '@/main/data/database-service';
import { socketManager } from '@/main/sockets/socket-manager';
import { MutationHandler, MutationResult } from '@/main/types';
import { ServerUserNodeSyncMutationInput } from '@/operations/mutations/server-user-node-sync';

export class ServerUserNodeSyncMutationHandler
  implements MutationHandler<ServerUserNodeSyncMutationInput>
{
  public async handleMutation(
    input: ServerUserNodeSyncMutationInput
  ): Promise<MutationResult<ServerUserNodeSyncMutationInput>> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('account_id', '=', input.accountId),
          eb('workspace_id', '=', input.workspaceId),
        ])
      )
      .executeTakeFirst();

    if (!workspace) {
      return {
        output: {
          success: false,
        },
      };
    }

    const userId = workspace.user_id;
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('user_nodes')
      .values({
        user_id: input.userId,
        node_id: input.nodeId,
        version_id: input.versionId,
        last_seen_at: input.lastSeenAt,
        last_seen_version_id: input.lastSeenVersionId,
        mentions_count: input.mentionsCount,
        created_at: input.createdAt,
        updated_at: input.updatedAt,
      })
      .onConflict((cb) =>
        cb.columns(['node_id', 'user_id']).doUpdateSet({
          last_seen_at: input.lastSeenAt,
          last_seen_version_id: input.lastSeenVersionId,
          mentions_count: input.mentionsCount,
          updated_at: input.updatedAt,
          version_id: input.versionId,
        })
      )
      .execute();

    socketManager.sendMessage(workspace.account_id, {
      type: 'local_user_node_sync',
      userId: input.userId,
      nodeId: input.nodeId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
    });

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'user_nodes',
          userId: userId,
        },
      ],
    };
  }
}
