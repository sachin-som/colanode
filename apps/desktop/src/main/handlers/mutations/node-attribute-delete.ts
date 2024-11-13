import { MutationHandler, MutationResult } from '@/main/types';
import { NodeAttributeDeleteMutationInput } from '@/operations/mutations/node-attribute-delete';
import { nodeService } from '@/main/services/node-service';
import { unset } from 'lodash-es';

export class NodeAttributeDeleteMutationHandler
  implements MutationHandler<NodeAttributeDeleteMutationInput>
{
  async handleMutation(
    input: NodeAttributeDeleteMutationInput
  ): Promise<MutationResult<NodeAttributeDeleteMutationInput>> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      unset(attributes, input.path);
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
