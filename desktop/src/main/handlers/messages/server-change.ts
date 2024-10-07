import { MessageContext, MessageHandler } from '@/operations/messages';
import { ServerChangeMessageInput } from '@/operations/messages/server-change';
import { mediator } from '@/main/mediator';

export class ServerChangeMessageHandler
  implements MessageHandler<ServerChangeMessageInput>
{
  public async handleMessage(
    context: MessageContext,
    input: ServerChangeMessageInput,
  ): Promise<void> {
    if (input.change.table === 'nodes' && input.change.workspaceId) {
      await mediator.executeMutation({
        type: 'node_sync',
        id: input.change.id,
        accountId: context.accountId,
        workspaceId: input.change.workspaceId,
        action: input.change.action,
        after: input.change.after,
        before: input.change.before,
      });
    } else if (
      input.change.table === 'node_reactions' &&
      input.change.workspaceId
    ) {
      await mediator.executeMutation({
        type: 'node_reaction_sync',
        id: input.change.id,
        accountId: context.accountId,
        workspaceId: input.change.workspaceId,
        action: input.change.action,
        after: input.change.after,
        before: input.change.before,
      });
    } else if (
      input.change.table === 'node_collaborator' &&
      input.change.workspaceId
    ) {
      await mediator.executeMutation({
        type: 'node_collaborator_sync',
        id: input.change.id,
        accountId: context.accountId,
        workspaceId: input.change.workspaceId,
        action: input.change.action,
        after: input.change.after,
        before: input.change.before,
      });
    }

    await mediator.executeMessage(
      {
        accountId: context.accountId,
        deviceId: context.deviceId,
      },
      {
        type: 'server_change_ack',
        changeId: input.change.id,
      },
    );
  }
}
