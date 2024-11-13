import { generateId, IdType } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  MarkNodeAsSeenMutationInput,
  MarkNodeAsSeenMutationOutput,
} from '@/shared/mutations/mark-node-as-seen';
import { LocalUserNodeChangeData } from '@/shared/types/sync';

export class MarkNodeAsSeenMutationHandler
  implements MutationHandler<MarkNodeAsSeenMutationInput>
{
  async handleMutation(
    input: MarkNodeAsSeenMutationInput
  ): Promise<MarkNodeAsSeenMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const changeData: LocalUserNodeChangeData = {
      type: 'user_node_update',
      nodeId: input.nodeId,
      userId: input.userId,
      lastSeenVersionId: input.versionId,
      lastSeenAt: new Date().toISOString(),
      mentionsCount: 0,
      versionId: generateId(IdType.Version),
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .updateTable('user_nodes')
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
          retry_count: 0,
        })
        .execute();
    });

    return {
      success: true,
    };
  }
}
