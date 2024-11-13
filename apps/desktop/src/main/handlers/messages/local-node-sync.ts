import { MessageContext, MessageHandler } from '@/operations/messages';
import { LocalNodeSyncMessageInput } from '@/operations/messages/local-node-sync';
import { socketService } from '@/main/services/socket-service';

export class LocalNodeSyncMessageHandler
  implements MessageHandler<LocalNodeSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: LocalNodeSyncMessageInput
  ): Promise<void> {
    socketService.sendMessage(context.accountId, input);
  }
}
