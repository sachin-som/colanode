import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerUserNodeSyncMessageInput } from '@/operations/messages/server-user-node-sync';
import { mediator } from '@/main/mediator';

export class ServerUserNodeSyncMessageHandler
  implements MessageHandler<ServerUserNodeSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerUserNodeSyncMessageInput
  ): Promise<void> {
    await mediator.executeMutation({
      type: 'server_user_node_sync',
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
