import { databaseContext } from '@/main/data/database-context';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeCollaboratorDeleteMutationInput } from '@/types/mutations/node-collaborator-delete';

export class NodeCollaboratorDeleteMutationHandler
  implements MutationHandler<NodeCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorDeleteMutationInput,
  ): Promise<MutationResult<NodeCollaboratorDeleteMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

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
