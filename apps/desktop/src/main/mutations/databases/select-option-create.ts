import {
  compareString,
  DatabaseAttributes,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  SelectOptionCreateMutationInput,
  SelectOptionCreateMutationOutput,
} from '@/shared/mutations/databases/select-option-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class SelectOptionCreateMutationHandler
  implements MutationHandler<SelectOptionCreateMutationInput>
{
  async handleMutation(
    input: SelectOptionCreateMutationInput
  ): Promise<SelectOptionCreateMutationOutput> {
    const id = generateId(IdType.SelectOption);
    const result = await entryService.updateEntry<DatabaseAttributes>(
      input.databaseId,
      input.userId,
      (attributes) => {
        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            MutationErrorCode.FieldNotFound,
            'The field you are trying to create a select option in does not exist.'
          );
        }

        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new MutationError(
            MutationErrorCode.FieldTypeInvalid,
            'The field you are trying to create a select option in is not a "Select" or "Multi-Select" field.'
          );
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

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SelectOptionCreateForbidden,
        "You don't have permission to create a select option in this field."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.SelectOptionCreateFailed,
        'Something went wrong while creating the select option.'
      );
    }

    return {
      id: id,
    };
  }
}
