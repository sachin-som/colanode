import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeCollaboratorCreateMutationInput } from '@/operations/mutations/node-collaborator-create';
import * as Y from 'yjs';
import { updateNodeAtomically } from '@/main/utils';

export class NodeCollaboratorCreateMutationHandler
  implements MutationHandler<NodeCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorCreateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorCreateMutationInput>> {
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
        input.collaboratorIds.forEach((collaboratorId) => {
          collaboratorsMap.set(collaboratorId, input.role);
        });
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
