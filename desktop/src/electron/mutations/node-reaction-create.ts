import { databaseContext } from '@/electron/database-context';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeReactionCreateMutationInput } from '@/types/mutations/node-reaction-create';

export class NodeReactionCreateMutationHandler
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput,
  ): Promise<MutationResult<NodeReactionCreateMutationInput>> {
    console.log('create node reaction', input);
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    await workspaceDatabase
      .insertInto('node_reactions')
      .values({
        node_id: input.nodeId,
        actor_id: input.userId,
        reaction: input.reaction,
        created_at: new Date().toISOString(),
      })
      .onConflict((b) => b.doNothing())
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
