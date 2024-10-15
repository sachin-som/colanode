import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerNodesSyncMessageInput } from '@/operations/messages/server-nodes-sync';
import { mediator } from '@/main/mediator';

export class ServerNodesSyncMessageHandler
  implements MessageHandler<ServerNodesSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerNodesSyncMessageInput,
  ): Promise<void> {
    await mediator.executeMutation({
      type: 'node_sync',
      nodes: input.nodes,
      accountId: context.accountId,
    });
  }
}
