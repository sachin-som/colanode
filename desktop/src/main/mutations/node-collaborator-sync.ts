import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeCollaboratorSyncMutationInput } from '@/types/mutations/node-collaborator-sync';
import { ServerNodeCollaborator, ServerNodeReaction } from '@/types/nodes';

export class NodeCollaboratorSyncMutationHandler
  implements MutationHandler<NodeCollaboratorSyncMutationInput>
{
  public async handleMutation(
    input: NodeCollaboratorSyncMutationInput,
  ): Promise<MutationResult<NodeCollaboratorSyncMutationInput>> {
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
      await this.insertNodeCollaborator(userId, input.after);
    } else if (input.action === 'update' && input.after) {
      await this.updateNodeCollaborator(userId, input.after);
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
          table: 'node_collaborators',
          userId: userId,
        },
      ],
    };
  }

  private async insertNodeCollaborator(
    userId: string,
    nodeCollaborator: ServerNodeCollaborator,
  ): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('node_collaborators')
      .values({
        node_id: nodeCollaborator.nodeId,
        collaborator_id: nodeCollaborator.collaboratorId,
        role: nodeCollaborator.role,
        created_at: nodeCollaborator.createdAt,
        created_by: nodeCollaborator.createdBy,
        updated_by: nodeCollaborator.updatedBy,
        updated_at: nodeCollaborator.updatedAt,
        version_id: nodeCollaborator.versionId,
        server_created_at: nodeCollaborator.serverCreatedAt,
        server_updated_at: nodeCollaborator.serverUpdatedAt,
        server_version_id: nodeCollaborator.versionId,
      })
      .onConflict((cb) =>
        cb
          .doUpdateSet({
            server_created_at: nodeCollaborator.serverCreatedAt,
            server_updated_at: nodeCollaborator.serverUpdatedAt,
            server_version_id: nodeCollaborator.versionId,
          })
          .where('version_id', '=', nodeCollaborator.versionId),
      )
      .execute();
  }

  private async updateNodeCollaborator(
    userId: string,
    nodeCollaborator: ServerNodeCollaborator,
  ): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    const existingNodeCollaborator = await workspaceDatabase
      .selectFrom('node_collaborators')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('node_id', '=', nodeCollaborator.nodeId),
          eb('collaborator_id', '=', nodeCollaborator.collaboratorId),
        ]),
      )
      .executeTakeFirst();

    if (
      existingNodeCollaborator.server_version_id === nodeCollaborator.versionId
    ) {
      return;
    }

    if (existingNodeCollaborator.updated_at) {
      if (!nodeCollaborator.updatedAt) {
        return;
      }
      const localUpdatedAt = new Date(existingNodeCollaborator.updated_at);
      const serverUpdatedAt = new Date(nodeCollaborator.updatedAt);
      if (localUpdatedAt > serverUpdatedAt) {
        return;
      }
    }

    await workspaceDatabase
      .updateTable('node_collaborators')
      .set({
        role: nodeCollaborator.role,
        updated_at: nodeCollaborator.updatedAt,
        updated_by: nodeCollaborator.updatedBy,
        version_id: nodeCollaborator.versionId,
        server_created_at: nodeCollaborator.serverCreatedAt,
        server_updated_at: nodeCollaborator.serverUpdatedAt,
        server_version_id: nodeCollaborator.versionId,
      })
      .where((eb) =>
        eb.and([
          eb('node_id', '=', nodeCollaborator.nodeId),
          eb('collaborator_id', '=', nodeCollaborator.collaboratorId),
        ]),
      )
      .execute();
  }

  private async deleteNodeReaction(
    userId: string,
    nodeCollaborator: ServerNodeCollaborator,
  ): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .deleteFrom('node_collaborators')
      .where((eb) =>
        eb.and([
          eb('node_id', '=', nodeCollaborator.nodeId),
          eb('collaborator_id', '=', nodeCollaborator.collaboratorId),
        ]),
      )
      .execute();
  }
}
