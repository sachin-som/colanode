import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionDeleteMutationInput } from '@/operations/mutations/node-reaction-delete';

export class NodeReactionDeleteMutationHandler
  implements MutationHandler<NodeReactionDeleteMutationInput>
{
  async handleMutation(
    input: NodeReactionDeleteMutationInput,
  ): Promise<MutationResult<NodeReactionDeleteMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

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
      changes: [
        {
          type: 'workspace',
          table: 'node_reactions',
          userId: input.userId,
        },
      ],
    };
  }
}
