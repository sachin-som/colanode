import { databaseManager } from '@/main/data/database-manager';
import { socketManager } from '@/main/sockets/socket-manager';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { ServerNodeUserStateSyncMutationInput } from '@/operations/mutations/server-node-user-state-sync';

export class ServerNodeUserStateSyncMutationHandler
  implements MutationHandler<ServerNodeUserStateSyncMutationInput>
{
  public async handleMutation(
    input: ServerNodeUserStateSyncMutationInput,
  ): Promise<MutationResult<ServerNodeUserStateSyncMutationInput>> {
    const workspace = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('account_id', '=', input.accountId),
          eb('workspace_id', '=', input.workspaceId),
        ]),
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
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('node_user_states')
      .values({
        node_id: input.nodeId,
        user_id: input.userId,
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
        }),
      )
      .execute();

    socketManager.sendMessage(workspace.account_id, {
      type: 'local_node_user_state_sync',
      nodeId: input.nodeId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: input.userId,
    });

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'node_user_states',
          userId: userId,
        },
      ],
    };
  }
}
