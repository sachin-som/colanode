import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionDeleteMutationInput } from '@/operations/mutations/node-reaction-delete';
import * as Y from 'yjs';
import { updateNodeAtomically } from '@/main/utils';

export class NodeReactionDeleteMutationHandler
  implements MutationHandler<NodeReactionDeleteMutationInput>
{
  async handleMutation(
    input: NodeReactionDeleteMutationInput,
  ): Promise<MutationResult<NodeReactionDeleteMutationInput>> {
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

        const index = reactionArray.toArray().indexOf(input.userId);
        if (index === -1) {
          return;
        }

        reactionArray.delete(index);
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
