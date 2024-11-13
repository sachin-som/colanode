import { MutationHandler, MutationResult } from '@/main/types';
import { NodeAttributeSetMutationInput } from '@/operations/mutations/node-attribute-set';
import { nodeService } from '@/main/services/node-service';
import { set } from 'lodash-es';

export class NodeAttributeSetMutationHandler
  implements MutationHandler<NodeAttributeSetMutationInput>
{
  async handleMutation(
    input: NodeAttributeSetMutationInput
  ): Promise<MutationResult<NodeAttributeSetMutationInput>> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
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
