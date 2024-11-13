import { MessageContext, MessageHandler } from '@/operations/messages';
import { LocalUserNodeSyncMessageInput } from '@/operations/messages/local-user-node-sync';
import { socketService } from '@/main/services/socket-service';

export class LocalUserNodeSyncMessageHandler
  implements MessageHandler<LocalUserNodeSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: LocalUserNodeSyncMessageInput
  ): Promise<void> {
    socketService.sendMessage(context.accountId, input);
  }
}
