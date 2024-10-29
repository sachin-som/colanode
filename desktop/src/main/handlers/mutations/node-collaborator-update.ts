import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeCollaboratorUpdateMutationInput } from '@/operations/mutations/node-collaborator-update';
import * as Y from 'yjs';
import { updateNodeAtomically } from '@/main/utils';

export class NodeCollaboratorUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorUpdateMutationInput>> {
    const result = await updateNodeAtomically(
      input.userId,
      input.nodeId,
      (attributesMap) => {
        if (!attributesMap.has('collaborators')) {
          attributesMap.set('collaborators', new Y.Map());
        }

        const collaboratorsMap = attributesMap.get(
          'collaborators',
        ) as Y.Map<any>;
        collaboratorsMap.set(input.collaboratorId, input.role);
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
