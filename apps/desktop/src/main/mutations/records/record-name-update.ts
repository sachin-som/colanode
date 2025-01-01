import { RecordAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  RecordNameUpdateMutationInput,
  RecordNameUpdateMutationOutput,
} from '@/shared/mutations/records/record-name-update';

export class RecordNameUpdateMutationHandler
  implements MutationHandler<RecordNameUpdateMutationInput>
{
  async handleMutation(
    input: RecordNameUpdateMutationInput
  ): Promise<RecordNameUpdateMutationOutput> {
    const result = await entryService.updateEntry<RecordAttributes>(
      input.recordId,
      input.userId,
      (attributes) => {
        attributes.name = input.name;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to update this record."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateFailed,
        'Something went wrong while updating the record name. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
