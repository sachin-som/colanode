import { MessageContext, MessageHandler } from '@/shared/messages';
import { LocalUserNodeSyncMessageInput } from '../../../shared/messages/local-user-node-sync';
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
