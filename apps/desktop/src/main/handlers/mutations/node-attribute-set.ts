import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeAttributeSetMutationInput } from '@/operations/mutations/node-attribute-set';
import { nodeManager } from '@/main/node-manager';
import { set } from 'lodash';

export class NodeAttributeSetMutationHandler
  implements MutationHandler<NodeAttributeSetMutationInput>
{
  async handleMutation(
    input: NodeAttributeSetMutationInput,
  ): Promise<MutationResult<NodeAttributeSetMutationInput>> {
    await nodeManager.updateNode(input.userId, input.nodeId, (attributes) => {
      set(attributes, input.path, input.value);
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
