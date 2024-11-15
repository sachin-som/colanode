import { MutationHandler } from '@/main/types';
import {
  NodeDeleteMutationInput,
  NodeDeleteMutationOutput,
} from '@/shared/mutations/node-delete';
import { nodeService } from '@/main/services/node-service';

export class NodeDeleteMutationHandler
  implements MutationHandler<NodeDeleteMutationInput>
{
  async handleMutation(
    input: NodeDeleteMutationInput
  ): Promise<NodeDeleteMutationOutput> {
    await nodeService.deleteNode(input.nodeId, input.userId);

    return {
      success: true,
    };
  }
}
