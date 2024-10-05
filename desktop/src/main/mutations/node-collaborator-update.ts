import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeCollaboratorUpdateMutationInput } from '@/types/mutations/node-collaborator-update';

export class NodeCollaboratorUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorUpdateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    await workspaceDatabase
      .updateTable('node_collaborators')
      .set({
        role: input.role,
        updated_at: new Date().toISOString(),
        updated_by: input.userId,
        version_id: generateId(IdType.Version),
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
          userId: input.userId,
        },
      ],
    };
  }
}
