import { RecordAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  RecordFieldValueDeleteMutationInput,
  RecordFieldValueDeleteMutationOutput,
} from '@/shared/mutations/records/record-field-value-delete';

export class RecordFieldValueDeleteMutationHandler
  implements MutationHandler<RecordFieldValueDeleteMutationInput>
{
  async handleMutation(
    input: RecordFieldValueDeleteMutationInput
  ): Promise<RecordFieldValueDeleteMutationOutput> {
    const result = await entryService.updateEntry<RecordAttributes>(
      input.recordId,
      input.userId,
      (attributes) => {
        delete attributes.fields[input.fieldId];
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to delete this field value."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateFailed,
        'Something went wrong while deleting the field value. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
