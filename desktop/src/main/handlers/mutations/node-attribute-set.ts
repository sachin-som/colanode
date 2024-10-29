import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeAttributeSetMutationInput } from '@/operations/mutations/node-attribute-set';
import { updateNodeAtomically } from '@/main/utils';

export class NodeAttributeSetMutationHandler
  implements MutationHandler<NodeAttributeSetMutationInput>
{
  async handleMutation(
    input: NodeAttributeSetMutationInput,
  ): Promise<MutationResult<NodeAttributeSetMutationInput>> {
    const result = await updateNodeAtomically(
      input.userId,
      input.nodeId,
      (attributesMap) => {
        attributesMap.set(input.attribute, input.value);
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
