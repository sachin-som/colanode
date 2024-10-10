import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerChangeResultMessageInput } from '@/operations/messages/server-change-result';
import { socketManager } from '@/main/sockets/socket-manager';

export class ServerChangeResultMessageHandler
  implements MessageHandler<ServerChangeResultMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerChangeResultMessageInput,
  ): Promise<void> {
    socketManager.sendMessage(context.accountId, input);
  }
}
