import { updateNodeAtomically } from '@/main/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeCollaboratorDeleteMutationInput } from '@/operations/mutations/node-collaborator-delete';
import * as Y from 'yjs';

export class NodeCollaboratorDeleteMutationHandler
  implements MutationHandler<NodeCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorDeleteMutationInput,
  ): Promise<MutationResult<NodeCollaboratorDeleteMutationInput>> {
    const result = await updateNodeAtomically(
      input.userId,
      input.nodeId,
      (attributesMap) => {
        const collaboratorsMap = attributesMap.get(
          'collaborators',
        ) as Y.Map<any>;
        collaboratorsMap.delete(input.collaboratorId);
      },
    );

    if (!result) {
      return {
        output: {
          success: false,
        },
      };
    }

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
