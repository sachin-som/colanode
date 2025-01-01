import { ChannelAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  ChannelUpdateMutationInput,
  ChannelUpdateMutationOutput,
} from '@/shared/mutations/channels/channel-update';

export class ChannelUpdateMutationHandler
  implements MutationHandler<ChannelUpdateMutationInput>
{
  async handleMutation(
    input: ChannelUpdateMutationInput
  ): Promise<ChannelUpdateMutationOutput> {
    const result = await entryService.updateEntry<ChannelAttributes>(
      input.channelId,
      input.userId,
      (attributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'not_found') {
      throw new MutationError(
        MutationErrorCode.ChannelNotFound,
        'Channel not found or has been deleted.'
      );
    }

    if (result === 'invalid_attributes') {
      throw new MutationError(
        MutationErrorCode.ChannelUpdateFailed,
        'Something went wrong while updating the channel.'
      );
    }

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.ChannelUpdateForbidden,
        "You don't have permission to update this channel."
      );
    }

    if (result === 'success') {
      return {
        success: true,
      };
    }

    throw new MutationError(
      MutationErrorCode.Unknown,
      'Something went wrong while updating the channel.'
    );
  }
}
