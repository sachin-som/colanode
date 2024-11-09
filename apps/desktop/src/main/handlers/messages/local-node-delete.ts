import { MessageContext, MessageHandler } from '@/operations/messages';
import { LocalNodeDeleteMessageInput } from '@/operations/messages/local-node-delete';
import { socketManager } from '@/main/sockets/socket-manager';

export class LocalNodeDeleteMessageHandler
  implements MessageHandler<LocalNodeDeleteMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: LocalNodeDeleteMessageInput
  ): Promise<void> {
    socketManager.sendMessage(context.accountId, input);
  }
}
