import { DatabaseAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  SelectOptionDeleteMutationInput,
  SelectOptionDeleteMutationOutput,
} from '@/shared/mutations/databases/select-option-delete';

export class SelectOptionDeleteMutationHandler
  implements MutationHandler<SelectOptionDeleteMutationInput>
{
  async handleMutation(
    input: SelectOptionDeleteMutationInput
  ): Promise<SelectOptionDeleteMutationOutput> {
    const result = await entryService.updateEntry<DatabaseAttributes>(
      input.databaseId,
      input.userId,
      (attributes) => {
        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            MutationErrorCode.FieldNotFound,
            'The field you are trying to delete a select option from does not exist.'
          );
        }

        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new MutationError(
            MutationErrorCode.FieldTypeInvalid,
            'The field you are trying to delete a select option from is not a "Select" or "Multi-Select" field.'
          );
        }

        if (!field.options) {
          throw new MutationError(
            MutationErrorCode.SelectOptionNotFound,
            'The field you are trying to delete a select option from does not have any select options.'
          );
        }

        if (!field.options[input.optionId]) {
          throw new MutationError(
            MutationErrorCode.SelectOptionNotFound,
            'The select option you are trying to delete does not exist.'
          );
        }

        delete field.options[input.optionId];

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SelectOptionDeleteForbidden,
        "You don't have permission to delete this select option."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.SelectOptionDeleteFailed,
        'Something went wrong while deleting the select option.'
      );
    }

    return {
      id: input.optionId,
    };
  }
}
