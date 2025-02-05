import { MutationHandler } from '@/main/lib/types';
import {
  ChannelDeleteMutationInput,
  ChannelDeleteMutationOutput,
} from '@/shared/mutations/channels/channel-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class ChannelDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ChannelDeleteMutationInput>
{
  async handleMutation(
    input: ChannelDeleteMutationInput
  ): Promise<ChannelDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.channelId);

    return {
      success: true,
    };
  }
}
