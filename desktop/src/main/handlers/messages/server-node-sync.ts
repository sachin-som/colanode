import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerNodeSyncMessageInput } from '@/operations/messages/server-node-sync';
import { mediator } from '@/main/mediator';

export class ServerNodeSyncMessageHandler
  implements MessageHandler<ServerNodeSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerNodeSyncMessageInput,
  ): Promise<void> {
    await mediator.executeMutation({
      type: 'server_node_sync',
      accountId: context.accountId,
      id: input.id,
      workspaceId: input.workspaceId,
      state: input.state,
      createdAt: input.createdAt,
      createdBy: input.createdBy,
      updatedAt: input.updatedAt,
      updatedBy: input.updatedBy,
      serverCreatedAt: input.serverCreatedAt,
      serverUpdatedAt: input.serverUpdatedAt,
      versionId: input.versionId,
    });
  }
}
