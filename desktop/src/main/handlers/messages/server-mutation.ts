import { MessageHandler } from '@/operations/messages';
import { ServerMutationMessageInput } from '@/operations/messages/server-mutation';
import { mediator } from '@/main/mediator';

export class ServerMutationMessageHandler
  implements MessageHandler<ServerMutationMessageInput>
{
  public async handleMessage(input: ServerMutationMessageInput): Promise<void> {
    if (input.change.table === 'nodes' && input.change.workspaceId) {
      await mediator.executeMutation({
        type: 'node_sync',
        id: input.change.id,
        accountId: input.accountId,
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
        accountId: input.accountId,
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
        accountId: input.accountId,
        workspaceId: input.change.workspaceId,
        action: input.change.action,
        after: input.change.after,
        before: input.change.before,
      });
    }
  }
}
