import { RecordAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  RecordFieldValueSetMutationInput,
  RecordFieldValueSetMutationOutput,
} from '@/shared/mutations/records/record-field-value-set';

export class RecordFieldValueSetMutationHandler
  implements MutationHandler<RecordFieldValueSetMutationInput>
{
  async handleMutation(
    input: RecordFieldValueSetMutationInput
  ): Promise<RecordFieldValueSetMutationOutput> {
    const result = await entryService.updateEntry<RecordAttributes>(
      input.recordId,
      input.userId,
      (attributes) => {
        attributes.fields[input.fieldId] = input.value;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to set this field value."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateFailed,
        'Something went wrong while setting the field value.'
      );
    }

    return {
      success: true,
    };
  }
}
