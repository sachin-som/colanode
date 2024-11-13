import { MessageContext, MessageHandler } from '@/operations/messages';
import { LocalNodeDeleteMessageInput } from '@/operations/messages/local-node-delete';
import { socketService } from '@/main/services/socket-service';

export class LocalNodeDeleteMessageHandler
  implements MessageHandler<LocalNodeDeleteMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: LocalNodeDeleteMessageInput
  ): Promise<void> {
    socketService.sendMessage(context.accountId, input);
  }
}
