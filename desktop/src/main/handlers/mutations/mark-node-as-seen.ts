import { generateId, IdType } from '@/lib/id';
import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { MarkNodeAsSeenMutationInput } from '@/operations/mutations/mark-node-as-seen';
import { LocalNodeUserStateChangeData } from '@/types/sync';

export class MarkNodeAsSeenMutationHandler
  implements MutationHandler<MarkNodeAsSeenMutationInput>
{
  async handleMutation(
    input: MarkNodeAsSeenMutationInput,
  ): Promise<MutationResult<MarkNodeAsSeenMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const changeData: LocalNodeUserStateChangeData = {
      type: 'node_user_state_update',
      nodeId: input.nodeId,
      userId: input.userId,
      lastSeenVersionId: input.versionId,
      lastSeenAt: new Date().toISOString(),
      mentionsCount: 0,
      versionId: generateId(IdType.Version),
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .updateTable('node_user_states')
        .set({
          last_seen_version_id: input.versionId,
          last_seen_at: new Date().toISOString(),
          mentions_count: 0,
          version_id: generateId(IdType.Version),
        })
        .where('node_id', '=', input.nodeId)
        .where('user_id', '=', input.userId)
        .execute();

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'node_user_states',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
