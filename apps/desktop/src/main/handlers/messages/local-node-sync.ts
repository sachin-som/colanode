import { MessageContext, MessageHandler } from '@/operations/messages';
import { LocalNodeSyncMessageInput } from '@/operations/messages/local-node-sync';
import { socketManager } from '@/main/sockets/socket-manager';

export class LocalNodeSyncMessageHandler
  implements MessageHandler<LocalNodeSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: LocalNodeSyncMessageInput
  ): Promise<void> {
    socketManager.sendMessage(context.accountId, input);
  }
}
