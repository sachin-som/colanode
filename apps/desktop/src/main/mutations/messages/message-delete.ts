import { MutationHandler } from '@/main/lib/types';
import {
  MessageDeleteMutationInput,
  MessageDeleteMutationOutput,
} from '@/shared/mutations/messages/message-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';
export class MessageDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<MessageDeleteMutationInput>
{
  async handleMutation(
    input: MessageDeleteMutationInput
  ): Promise<MessageDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.messageId);

    return {
      success: true,
    };
  }
}
