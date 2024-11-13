import { nodeService } from '@/main/services/node-service';
import { MutationHandler, MutationResult } from '@/main/types';
import { NodeCollaboratorUpdateMutationInput } from '@/operations/mutations/node-collaborator-update';
import { set } from 'lodash-es';

export class NodeCollaboratorUpdateMutationHandler
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput
  ): Promise<MutationResult<NodeCollaboratorUpdateMutationInput>> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
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
