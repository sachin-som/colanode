import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeServerDeleteMutationInput } from '@/operations/mutations/node-server-delete';

export class NodeServerDeleteMutationHandler
  implements MutationHandler<NodeServerDeleteMutationInput>
{
  public async handleMutation(
    input: NodeServerDeleteMutationInput,
  ): Promise<MutationResult<NodeServerDeleteMutationInput>> {
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
      .deleteFrom('nodes')
      .where('id', '=', input.id)
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: userId,
        },
      ],
    };
  }
}
