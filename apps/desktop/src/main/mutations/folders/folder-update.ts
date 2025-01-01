import { FolderAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  FolderUpdateMutationInput,
  FolderUpdateMutationOutput,
} from '@/shared/mutations/folders/folder-update';

export class FolderUpdateMutationHandler
  implements MutationHandler<FolderUpdateMutationInput>
{
  async handleMutation(
    input: FolderUpdateMutationInput
  ): Promise<FolderUpdateMutationOutput> {
    const result = await entryService.updateEntry<FolderAttributes>(
      input.folderId,
      input.userId,
      (attributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.FolderUpdateForbidden,
        "You don't have permission to update this folder."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.FolderUpdateFailed,
        'There was an error while updating the folder. Please try again.'
      );
    }

    return {
      success: true,
    };
  }
}
