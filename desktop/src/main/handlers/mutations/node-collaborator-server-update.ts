import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeCollaboratorServerUpdateMutationInput } from '@/operations/mutations/node-collaborator-server-update';

export class NodeCollaboratorServerUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorServerUpdateMutationInput>
{
  public async handleMutation(
    input: NodeCollaboratorServerUpdateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorServerUpdateMutationInput>> {
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

    const nodeCollaborator = await workspaceDatabase
      .selectFrom('node_collaborators')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('node_id', '=', input.nodeId),
          eb('collaborator_id', '=', input.collaboratorId),
        ]),
      )
      .executeTakeFirst();

    if (nodeCollaborator.server_version_id === input.versionId) {
      return {
        output: {
          success: true,
        },
      };
    }

    if (nodeCollaborator.updated_at) {
      const localUpdatedAt = new Date(nodeCollaborator.updated_at);
      const serverUpdatedAt = new Date(input.updatedAt);
      if (localUpdatedAt > serverUpdatedAt) {
        return {
          output: {
            success: true,
          },
        };
      }
    }

    await workspaceDatabase
      .updateTable('node_collaborators')
      .set({
        role: input.role,
        updated_at: input.updatedAt,
        updated_by: input.updatedBy,
        version_id: input.versionId,
        server_updated_at: input.serverUpdatedAt,
        server_version_id: input.versionId,
      })
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
