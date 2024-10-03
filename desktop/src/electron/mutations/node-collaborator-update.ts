import { databaseContext } from '@/electron/database-context';
import { NeuronId } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeCollaboratorUpdateMutationInput } from '@/types/mutations/node-collaborator-update';

export class NodeCollaboratorUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorUpdateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    await workspaceDatabase
      .updateTable('node_collaborators')
      .set({
        role: input.role,
        updated_at: new Date().toISOString(),
        updated_by: input.userId,
        version_id: NeuronId.generate(NeuronId.Type.Version),
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
      changedTables: [
        {
          type: 'workspace',
          table: 'node_collaborators',
          userId: input.userId,
        },
      ],
    };
  }
}
