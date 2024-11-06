import { MessageContext, MessageHandler } from '@/operations/messages';
import { LocalUserNodeSyncMessageInput } from '@/operations/messages/local-user-node-sync';
import { socketManager } from '@/main/sockets/socket-manager';

export class LocalUserNodeSyncMessageHandler
  implements MessageHandler<LocalUserNodeSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: LocalUserNodeSyncMessageInput,
  ): Promise<void> {
    socketManager.sendMessage(context.accountId, input);
  }
}
