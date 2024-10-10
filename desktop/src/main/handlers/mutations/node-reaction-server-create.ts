import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionServerCreateMutationInput } from '@/operations/mutations/node-reaction-server-create';

export class NodeReactionServerCreateMutationHandler
  implements MutationHandler<NodeReactionServerCreateMutationInput>
{
  public async handleMutation(
    input: NodeReactionServerCreateMutationInput,
  ): Promise<MutationResult<NodeReactionServerCreateMutationInput>> {
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
      .insertInto('node_reactions')
      .values({
        node_id: input.nodeId,
        actor_id: input.actorId,
        reaction: input.reaction,
        created_at: input.createdAt,
        server_created_at: input.serverCreatedAt,
      })
      .onConflict((cb) =>
        cb
          .doUpdateSet({
            server_created_at: input.serverCreatedAt,
          })
          .where('server_created_at', 'is', null),
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
