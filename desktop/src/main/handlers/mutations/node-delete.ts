import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeDeleteMutationInput } from '@/operations/mutations/node-delete';

export class NodeDeleteMutationHandler
  implements MutationHandler<NodeDeleteMutationInput>
{
  async handleMutation(
    input: NodeDeleteMutationInput,
  ): Promise<MutationResult<NodeDeleteMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    await workspaceDatabase
      .deleteFrom('nodes')
      .where('id', '=', input.nodeId)
      .execute();

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
      ],
    };
  }
}
