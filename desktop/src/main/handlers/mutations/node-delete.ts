import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeDeleteMutationInput } from '@/operations/mutations/node-delete';
import { LocalDeleteNodeChangeData } from '@/types/sync';

export class NodeDeleteMutationHandler
  implements MutationHandler<NodeDeleteMutationInput>
{
  async handleMutation(
    input: NodeDeleteMutationInput,
  ): Promise<MutationResult<NodeDeleteMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .select(['id'])
      .where('id', '=', input.nodeId)
      .executeTakeFirst();

    if (!node) {
      return {
        output: {
          success: false,
        },
      };
    }

    const changeData: LocalDeleteNodeChangeData = {
      type: 'node_delete',
      id: node.id,
      deletedAt: new Date().toISOString(),
      deletedBy: input.userId,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx.deleteFrom('nodes').where('id', '=', input.nodeId).execute();

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
          table: 'nodes',
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
