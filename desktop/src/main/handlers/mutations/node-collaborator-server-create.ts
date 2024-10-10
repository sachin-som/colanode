import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeCollaboratorServerCreateMutationInput } from '@/operations/mutations/node-collaborator-server-create';

export class NodeCollaboratorServerCreateMutationHandler
  implements MutationHandler<NodeCollaboratorServerCreateMutationInput>
{
  public async handleMutation(
    input: NodeCollaboratorServerCreateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorServerCreateMutationInput>> {
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
      .insertInto('node_collaborators')
      .values({
        node_id: input.nodeId,
        collaborator_id: input.collaboratorId,
        role: input.role,
        created_at: input.createdAt,
        created_by: input.createdBy,
        version_id: input.versionId,
        server_created_at: input.serverCreatedAt,
        server_version_id: input.versionId,
      })
      .onConflict((cb) =>
        cb
          .doUpdateSet({
            server_created_at: input.serverCreatedAt,
            server_version_id: input.versionId,
          })
          .where('server_version_id', 'is', null),
      )
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
