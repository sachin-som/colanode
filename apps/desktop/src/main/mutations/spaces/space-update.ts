import { SpaceAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  SpaceUpdateMutationInput,
  SpaceUpdateMutationOutput,
} from '@/shared/mutations/spaces/space-update';

export class SpaceUpdateMutationHandler
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput
  ): Promise<SpaceUpdateMutationOutput> {
    const result = await entryService.updateEntry<SpaceAttributes>(
      input.id,
      input.userId,
      (attributes) => {
        attributes.name = input.name;
        attributes.description = input.description;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateForbidden,
        "You don't have permission to update this space."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateFailed,
        'Something went wrong while updating the space. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
