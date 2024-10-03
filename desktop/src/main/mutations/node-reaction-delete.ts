import { databaseContext } from '@/main/database-context';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeReactionDeleteMutationInput } from '@/types/mutations/node-reaction-delete';

export class NodeReactionDeleteMutationHandler
  implements MutationHandler<NodeReactionDeleteMutationInput>
{
  async handleMutation(
    input: NodeReactionDeleteMutationInput,
  ): Promise<MutationResult<NodeReactionDeleteMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    await workspaceDatabase
      .deleteFrom('node_reactions')
      .where((eb) =>
        eb.and([
          eb('node_id', '=', input.nodeId),
          eb('actor_id', '=', input.userId),
          eb('reaction', '=', input.reaction),
        ]),
      )
      .execute();

    return {
      output: {
        success: true,
      },
      changedTables: [
        {
          type: 'workspace',
          table: 'node_reactions',
          userId: input.userId,
        },
      ],
    };
  }
}
