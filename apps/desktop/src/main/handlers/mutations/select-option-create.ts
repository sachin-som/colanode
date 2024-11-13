import { generateId, IdType } from '@colanode/core';
import { generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/main/types';
import { SelectOptionCreateMutationInput } from '@/operations/mutations/select-option-create';
import { compareString } from '@/lib/utils';
import { nodeService } from '@/main/services/node-service';

export class SelectOptionCreateMutationHandler
  implements MutationHandler<SelectOptionCreateMutationInput>
{
  async handleMutation(
    input: SelectOptionCreateMutationInput
  ): Promise<MutationResult<SelectOptionCreateMutationInput>> {
    const id = generateId(IdType.SelectOption);
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        const fields = attributes.fields;
        if (!fields[input.fieldId]) {
          throw new Error('Field not found');
        }

        const field = fields[input.fieldId];
        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new Error('Field is not a select');
        }

        if (!field.options) {
          field.options = {};
        }

        const maxIndex = Object.values(field.options)
          .map((selectOption) => selectOption.index)
          .sort((a, b) => -compareString(a, b))[0];

        const index = generateNodeIndex(maxIndex, null);

        field.options[id] = {
          name: input.name,
          id: id,
          color: input.color,
          index: index,
        };

        return attributes;
      }
    );

    return {
      output: {
        id: id,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
      ],
    };
  }
}
