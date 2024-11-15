import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeReactionDeleteMutationInput,
  NodeReactionDeleteMutationOutput,
} from '@/shared/mutations/node-reaction-delete';

export class NodeReactionDeleteMutationHandler
  implements MutationHandler<NodeReactionDeleteMutationInput>
{
  async handleMutation(
    input: NodeReactionDeleteMutationInput
  ): Promise<NodeReactionDeleteMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      if (attributes.type !== 'message') {
        throw new Error('Node is not a message');
      }

      const reactions = attributes.reactions;
      if (!reactions[input.reaction]) {
        return attributes;
      }

      const reactionArray = reactions[input.reaction];

      const index = reactionArray.indexOf(input.userId);
      if (index === -1) {
        return attributes;
      }

      reactionArray.splice(index, 1);
      return attributes;
    });

    return {
      success: true,
    };
  }
}
