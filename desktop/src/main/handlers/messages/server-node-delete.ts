import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerNodeDeleteMessageInput } from '@/operations/messages/server-node-delete';
import { mediator } from '@/main/mediator';

export class ServerNodeDeleteMessageHandler
  implements MessageHandler<ServerNodeDeleteMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerNodeDeleteMessageInput,
  ): Promise<void> {
    await mediator.executeMutation({
      type: 'server_node_delete',
      accountId: context.accountId,
      id: input.id,
      workspaceId: input.workspaceId,
    });
  }
}
