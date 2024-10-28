import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerNodeUserStateSyncMessageInput } from '@/operations/messages/server-node-user-state-sync';
import { mediator } from '@/main/mediator';

export class ServerNodeUserStateSyncMessageHandler
  implements MessageHandler<ServerNodeUserStateSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerNodeUserStateSyncMessageInput,
  ): Promise<void> {
    await mediator.executeMutation({
      type: 'server_node_user_state_sync',
      accountId: context.accountId,
      nodeId: input.nodeId,
      userId: input.userId,
      workspaceId: input.workspaceId,
      versionId: input.versionId,
      lastSeenAt: input.lastSeenAt,
      lastSeenVersionId: input.lastSeenVersionId,
      mentionsCount: input.mentionsCount,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    });
  }
}
