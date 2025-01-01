import { DatabaseAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  FieldNameUpdateMutationInput,
  FieldNameUpdateMutationOutput,
} from '@/shared/mutations/databases/field-name-update';

export class FieldNameUpdateMutationHandler
  implements MutationHandler<FieldNameUpdateMutationInput>
{
  async handleMutation(
    input: FieldNameUpdateMutationInput
  ): Promise<FieldNameUpdateMutationOutput> {
    const result = await entryService.updateEntry<DatabaseAttributes>(
      input.databaseId,
      input.userId,
      (attributes) => {
        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            MutationErrorCode.FieldNotFound,
            'The field you are trying to update does not exist.'
          );
        }

        field.name = input.name;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.FieldUpdateForbidden,
        "You don't have permission to update this field."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.FieldUpdateFailed,
        'Something went wrong while updating the field.'
      );
    }

    return {
      id: input.fieldId,
    };
  }
}
