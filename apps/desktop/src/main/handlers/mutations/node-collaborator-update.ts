import { nodeManager } from '@/main/node-manager';
import { MutationHandler, MutationResult } from '@/main/types';
import { NodeCollaboratorUpdateMutationInput } from '@/operations/mutations/node-collaborator-update';
import { set } from 'lodash';

export class NodeCollaboratorUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput
  ): Promise<MutationResult<NodeCollaboratorUpdateMutationInput>> {
    await nodeManager.updateNode(input.userId, input.nodeId, (attributes) => {
      set(attributes, `collaborators.${input.collaboratorId}`, input.role);
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
