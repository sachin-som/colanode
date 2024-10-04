import { MessageHandler } from '@/operations/messages';
import { ServerMutationMessageInput } from '@/operations/messages/server-mutation';
import { mediator } from '@/main/mediator';

export class ServerMutationMessageHandler
  implements MessageHandler<ServerMutationMessageInput>
{
  public async handleMessage(input: ServerMutationMessageInput): Promise<void> {
    if (input.mutation.table === 'nodes' && input.mutation.workspaceId) {
      await mediator.executeMutation({
        type: 'node_sync',
        id: input.mutation.id,
        accountId: input.accountId,
        workspaceId: input.mutation.workspaceId,
        action: input.mutation.action,
        after: input.mutation.after,
        before: input.mutation.before,
      });
    } else if (
      input.mutation.table === 'node_reactions' &&
      input.mutation.workspaceId
    ) {
      await mediator.executeMutation({
        type: 'node_reaction_sync',
        id: input.mutation.id,
        accountId: input.accountId,
        workspaceId: input.mutation.workspaceId,
        action: input.mutation.action,
        after: input.mutation.after,
        before: input.mutation.before,
      });
    } else if (
      input.mutation.table === 'node_collaborator' &&
      input.mutation.workspaceId
    ) {
      await mediator.executeMutation({
        type: 'node_collaborator_sync',
        id: input.mutation.id,
        accountId: input.accountId,
        workspaceId: input.mutation.workspaceId,
        action: input.mutation.action,
        after: input.mutation.after,
        before: input.mutation.before,
      });
    }
  }
}
