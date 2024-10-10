import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeCollaboratorServerDeleteMutationInput } from '@/operations/mutations/node-collaborator-server-delete';

export class NodeCollaboratorServerDeleteMutationHandler
  implements MutationHandler<NodeCollaboratorServerDeleteMutationInput>
{
  public async handleMutation(
    input: NodeCollaboratorServerDeleteMutationInput,
  ): Promise<MutationResult<NodeCollaboratorServerDeleteMutationInput>> {
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
      .deleteFrom('node_collaborators')
      .where((eb) =>
        eb.and([
          eb('node_id', '=', input.nodeId),
          eb('collaborator_id', '=', input.collaboratorId),
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
          table: 'node_collaborators',
          userId: userId,
        },
      ],
    };
  }
}
