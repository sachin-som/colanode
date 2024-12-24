import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  ChannelDeleteMutationInput,
  ChannelDeleteMutationOutput,
} from '@/shared/mutations/channels/channel-delete';

export class ChannelDeleteMutationHandler
  implements MutationHandler<ChannelDeleteMutationInput>
{
  async handleMutation(
    input: ChannelDeleteMutationInput
  ): Promise<ChannelDeleteMutationOutput> {
    await entryService.deleteEntry(input.channelId, input.userId);

    return {
      success: true,
    };
  }
}
