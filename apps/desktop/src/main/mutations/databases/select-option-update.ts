import { DatabaseAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  SelectOptionUpdateMutationInput,
  SelectOptionUpdateMutationOutput,
} from '@/shared/mutations/databases/select-option-update';

export class SelectOptionUpdateMutationHandler
  implements MutationHandler<SelectOptionUpdateMutationInput>
{
  async handleMutation(
    input: SelectOptionUpdateMutationInput
  ): Promise<SelectOptionUpdateMutationOutput> {
    const result = await entryService.updateEntry<DatabaseAttributes>(
      input.databaseId,
      input.userId,
      (attributes) => {
        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            MutationErrorCode.FieldNotFound,
            'The field you are trying to update a select option in does not exist.'
          );
        }

        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new MutationError(
            MutationErrorCode.FieldTypeInvalid,
            'The field you are trying to update a select option in is not a "Select" or "Multi-Select" field.'
          );
        }

        if (!field.options) {
          field.options = {};
        }

        const option = field.options[input.optionId];
        if (!option) {
          throw new MutationError(
            MutationErrorCode.SelectOptionNotFound,
            'The select option you are trying to update does not exist.'
          );
        }

        option.name = input.name;
        option.color = input.color;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SelectOptionUpdateForbidden,
        "You don't have permission to update this select option."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.SelectOptionUpdateFailed,
        'Something went wrong while updating the select option.'
      );
    }

    return {
      id: input.optionId,
    };
  }
}
