import { nodeManager } from '@/main/node-manager';
import { MutationHandler, MutationResult } from '@/main/types';
import { NodeCollaboratorDeleteMutationInput } from '@/operations/mutations/node-collaborator-delete';
import { unset } from 'lodash-es';

export class NodeCollaboratorDeleteMutationHandler
  implements MutationHandler<NodeCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorDeleteMutationInput
  ): Promise<MutationResult<NodeCollaboratorDeleteMutationInput>> {
    await nodeManager.updateNode(input.userId, input.nodeId, (attributes) => {
      unset(attributes, `collaborators.${input.collaboratorId}`);
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
