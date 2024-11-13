import { MessageContext, MessageHandler } from '@/shared/messages';
import { ServerUserNodeSyncMessageInput } from '../../../shared/messages/server-user-node-sync';
import { mutationService } from '@/main/services/mutation-service';

export class ServerUserNodeSyncMessageHandler
  implements MessageHandler<ServerUserNodeSyncMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerUserNodeSyncMessageInput
  ): Promise<void> {
    await mutationService.executeMutation({
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
