import { MutationHandler } from '@/main/types';
import {
  NodeAttributeSetMutationInput,
  NodeAttributeSetMutationOutput,
} from '@/shared/mutations/node-attribute-set';
import { nodeService } from '@/main/services/node-service';
import { set } from 'lodash-es';

export class NodeAttributeSetMutationHandler
  implements MutationHandler<NodeAttributeSetMutationInput>
{
  async handleMutation(
    input: NodeAttributeSetMutationInput
  ): Promise<NodeAttributeSetMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      set(attributes, input.path, input.value);
      return attributes;
    });

    return {
      success: true,
    };
  }
}
