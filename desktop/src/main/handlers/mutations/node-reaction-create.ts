import { updateNodeAtomically } from '@/main/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionCreateMutationInput } from '@/operations/mutations/node-reaction-create';
import * as Y from 'yjs';

export class NodeReactionCreateMutationHandler
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput,
  ): Promise<MutationResult<NodeReactionCreateMutationInput>> {
    const result = await updateNodeAtomically(
      input.userId,
      input.nodeId,
      (attributesMap) => {
        if (!attributesMap.has('reactions')) {
          attributesMap.set('reactions', new Y.Map());
        }

        const reactionsMap = attributesMap.get('reactions') as Y.Map<any>;
        if (!reactionsMap.has(input.reaction)) {
          reactionsMap.set(input.reaction, new Y.Array());
        }

        const reactionArray = reactionsMap.get(
          input.reaction,
        ) as Y.Array<string>;
        if (reactionArray.toArray().includes(input.userId)) {
          return;
        }

        reactionArray.push([input.userId]);
      },
    );

    if (!result) {
      return {
        output: {
          success: false,
        },
      };
    }

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
