import { generateId, IdType } from '@colanode/core';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/main/types';
import { FieldCreateMutationInput } from '@/operations/mutations/field-create';
import { nodeManager } from '@/main/node-manager';

export class FieldCreateMutationHandler
  implements MutationHandler<FieldCreateMutationInput>
{
  async handleMutation(
    input: FieldCreateMutationInput
  ): Promise<MutationResult<FieldCreateMutationInput>> {
    const fieldId = generateId(IdType.Field);
    await nodeManager.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Invalid node type');
        }

        const maxIndex = Object.values(attributes.fields)
          .map((field) => field.index)
          .sort((a, b) => -compareString(a, b))[0];

        const index = generateNodeIndex(maxIndex, null);

        attributes.fields[fieldId] = {
          id: fieldId,
          type: input.fieldType,
          name: input.name,
          index,
        };

        return attributes;
      }
    );

    return {
      output: {
        id: fieldId,
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
