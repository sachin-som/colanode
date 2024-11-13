import { nodeService } from '@/main/services/node-service';
import { MutationHandler, MutationResult } from '@/main/types';
import { NodeReactionCreateMutationInput } from '@/operations/mutations/node-reaction-create';

export class NodeReactionCreateMutationHandler
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput
  ): Promise<MutationResult<NodeReactionCreateMutationInput>> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      if (attributes.type !== 'message') {
        throw new Error('Node is not a message');
      }

      const reactions = attributes.reactions;
      if (!reactions[input.reaction]) {
        reactions[input.reaction] = [];
      }

      if (reactions[input.reaction].includes(input.userId)) {
        return attributes;
      }

      reactions[input.reaction].push(input.userId);
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
