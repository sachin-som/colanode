import { databaseContext } from '@/main/database-context';
import { NeuronId } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeCollaboratorCreateMutationInput } from '@/types/mutations/node-collaborator-create';

export class NodeCollaboratorCreateMutationHandler
  implements MutationHandler<NodeCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorCreateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorCreateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    await workspaceDatabase
      .insertInto('node_collaborators')
      .values([
        input.collaboratorIds.map((collaboratorId) => {
          return {
            node_id: input.nodeId,
            collaborator_id: collaboratorId,
            role: input.role,
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          };
        }),
      ])
      .onConflict((cb) => cb.doNothing())
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
