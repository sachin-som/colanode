import { MessageContext, MessageHandler } from '@/shared/messages';
import { ServerNodeDeleteMessageInput } from '../../../shared/messages/server-node-delete';
import { mutationService } from '@/main/services/mutation-service';

export class ServerNodeDeleteMessageHandler
  implements MessageHandler<ServerNodeDeleteMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerNodeDeleteMessageInput
  ): Promise<void> {
    await mutationService.executeMutation({
      type: 'server_node_delete',
      accountId: context.accountId,
      id: input.id,
      workspaceId: input.workspaceId,
    });
  }
}
