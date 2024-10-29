import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeAttributeDeleteMutationInput } from '@/operations/mutations/node-attribute-delete';
import { updateNodeAtomically } from '@/main/utils';

export class NodeAttributeDeleteMutationHandler
  implements MutationHandler<NodeAttributeDeleteMutationInput>
{
  async handleMutation(
    input: NodeAttributeDeleteMutationInput,
  ): Promise<MutationResult<NodeAttributeDeleteMutationInput>> {
    const result = await updateNodeAtomically(
      input.userId,
      input.nodeId,
      (attributesMap) => {
        if (!attributesMap.has(input.attribute)) {
          return;
        }

        attributesMap.delete(input.attribute);
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
