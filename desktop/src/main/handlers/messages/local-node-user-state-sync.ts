import { MessageContext, MessageHandler } from '@/operations/messages';
import { LocalNodeUserStateSyncMessageInput } from '@/operations/messages/local-node-user-state-sync';
import { socketManager } from '@/main/sockets/socket-manager';

export class LocalNodeUserStateSyncMessageHandler
  implements MessageHandler<LocalNodeUserStateSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: LocalNodeUserStateSyncMessageInput,
  ): Promise<void> {
    socketManager.sendMessage(context.accountId, input);
  }
}
