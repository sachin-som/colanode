import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionSyncMutationInput } from '@/operations/mutations/node-reaction-sync';
import { ServerNodeReaction } from '@/types/nodes';

export class NodeReactionSyncMutationHandler
  implements MutationHandler<NodeReactionSyncMutationInput>
{
  public async handleMutation(
    input: NodeReactionSyncMutationInput,
  ): Promise<MutationResult<NodeReactionSyncMutationInput>> {
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
    if (input.action === 'insert' && input.after) {
      await this.insertNodeReaction(userId, input.after);
    } else if (input.action === 'delete' && input.before) {
      await this.deleteNodeReaction(userId, input.before);
    }

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

  private async insertNodeReaction(
    userId: string,
    nodeReaction: ServerNodeReaction,
  ): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('node_reactions')
      .values({
        node_id: nodeReaction.nodeId,
        actor_id: nodeReaction.actorId,
        reaction: nodeReaction.reaction,
        created_at: nodeReaction.createdAt,
        server_created_at: nodeReaction.serverCreatedAt,
      })
      .onConflict((ob) =>
        ob.doUpdateSet({
          server_created_at: nodeReaction.serverCreatedAt,
        }),
      )
      .execute();
  }

  private async deleteNodeReaction(
    userId: string,
    nodeReaction: ServerNodeReaction,
  ): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .deleteFrom('node_reactions')
      .where((eb) =>
        eb.and([
          eb('node_id', '=', nodeReaction.nodeId),
          eb('actor_id', '=', nodeReaction.actorId),
          eb('reaction', '=', nodeReaction.reaction),
        ]),
      )
      .execute();
  }
}
