import { MutationHandler, MutationResult } from '@/main/types';
import { NodeAttributeDeleteMutationInput } from '@/operations/mutations/node-attribute-delete';
import { nodeManager } from '@/main/node-manager';
import { unset } from 'lodash';

export class NodeAttributeDeleteMutationHandler
  implements MutationHandler<NodeAttributeDeleteMutationInput>
{
  async handleMutation(
    input: NodeAttributeDeleteMutationInput
  ): Promise<MutationResult<NodeAttributeDeleteMutationInput>> {
    await nodeManager.updateNode(input.userId, input.nodeId, (attributes) => {
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
