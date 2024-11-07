import { MutationHandler, MutationResult } from '@/main/types';
import { NodeCollaboratorCreateMutationInput } from '@/operations/mutations/node-collaborator-create';
import { nodeManager } from '@/main/node-manager';
import { set } from 'lodash';

export class NodeCollaboratorCreateMutationHandler
  implements MutationHandler<NodeCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorCreateMutationInput
  ): Promise<MutationResult<NodeCollaboratorCreateMutationInput>> {
    await nodeManager.updateNode(input.userId, input.nodeId, (attributes) => {
      for (const collaboratorId of input.collaboratorIds) {
        set(attributes, `collaborators.${collaboratorId}`, input.role);
      }
      return attributes;
    });

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
