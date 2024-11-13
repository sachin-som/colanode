import { nodeService } from '@/main/services/node-service';
import { MutationHandler, MutationResult } from '@/main/types';
import { NodeReactionDeleteMutationInput } from '@/operations/mutations/node-reaction-delete';

export class NodeReactionDeleteMutationHandler
  implements MutationHandler<NodeReactionDeleteMutationInput>
{
  async handleMutation(
    input: NodeReactionDeleteMutationInput
  ): Promise<MutationResult<NodeReactionDeleteMutationInput>> {
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
