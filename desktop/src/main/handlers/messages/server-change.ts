import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerChangeMessageInput } from '@/operations/messages/server-change';
import { synchronizer } from '@/main/synchronizer';

export class ServerChangeMessageHandler
  implements MessageHandler<ServerChangeMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerChangeMessageInput,
  ): Promise<void> {
    await synchronizer.handleServerChange(context.accountId, input.change);
  }
}
