import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerChangeBatchMessageInput } from '@/operations/messages/server-change-batch';
import { synchronizer } from '@/main/synchronizer';

export class ServerChangeBatchMessageHandler
  implements MessageHandler<ServerChangeBatchMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerChangeBatchMessageInput,
  ): Promise<void> {
    for (const change of input.changes) {
      await synchronizer.handleServerChange(context.accountId, change);
    }
  }
}
