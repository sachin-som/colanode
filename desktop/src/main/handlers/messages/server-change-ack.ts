import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerChangeAckMessageInput } from '@/operations/messages/server-change-ack';
import { socketManager } from '@/main/sockets/socket-manager';

export class ServerChangeAckMessageHandler
  implements MessageHandler<ServerChangeAckMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerChangeAckMessageInput,
  ): Promise<void> {
    socketManager.sendMessage(context.accountId, input);
  }
}
