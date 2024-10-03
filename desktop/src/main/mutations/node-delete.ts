import { databaseContext } from '@/main/database-context';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeDeleteMutationInput } from '@/types/mutations/node-delete';

export class NodeDeleteMutationHandler
  implements MutationHandler<NodeDeleteMutationInput>
{
  async handleMutation(
    input: NodeDeleteMutationInput,
  ): Promise<MutationResult<NodeDeleteMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    await workspaceDatabase
      .deleteFrom('nodes')
      .where('id', '=', input.nodeId)
      .execute();

    return {
      output: {
        success: true,
      },
      changedTables: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
      ],
    };
  }
}
