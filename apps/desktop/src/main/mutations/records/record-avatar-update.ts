import { RecordAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  RecordAvatarUpdateMutationInput,
  RecordAvatarUpdateMutationOutput,
} from '@/shared/mutations/records/record-avatar-update';

export class RecordAvatarUpdateMutationHandler
  implements MutationHandler<RecordAvatarUpdateMutationInput>
{
  async handleMutation(
    input: RecordAvatarUpdateMutationInput
  ): Promise<RecordAvatarUpdateMutationOutput> {
    const result = await entryService.updateEntry<RecordAttributes>(
      input.recordId,
      input.userId,
      (attributes) => {
        attributes.avatar = input.avatar;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to update this record."
      );
    }

    return {
      success: true,
    };
  }
}
