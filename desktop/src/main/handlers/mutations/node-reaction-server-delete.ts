import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionServerDeleteMutationInput } from '@/operations/mutations/node-reaction-server-delete';

export class NodeReactionServerDeleteMutationHandler
  implements MutationHandler<NodeReactionServerDeleteMutationInput>
{
  public async handleMutation(
    input: NodeReactionServerDeleteMutationInput,
  ): Promise<MutationResult<NodeReactionServerDeleteMutationInput>> {
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
      .deleteFrom('node_reactions')
      .where((eb) =>
        eb.and([
          eb('node_id', '=', input.nodeId),
          eb('actor_id', '=', input.actorId),
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
          userId: userId,
        },
      ],
    };
  }
}
