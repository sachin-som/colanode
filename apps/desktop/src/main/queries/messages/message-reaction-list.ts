import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { MessageReactionListQueryInput } from '@/shared/queries/messages/message-reaction-list';
import { Event } from '@/shared/types/events';
import { MessageReaction } from '@/shared/types/messages';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class MessageReactionsListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<MessageReactionListQueryInput>
{
  public async handleQuery(
    input: MessageReactionListQueryInput
  ): Promise<MessageReaction[]> {
    return this.fetchMessageReactions(input);
  }

  public async checkForChanges(
    event: Event,
    input: MessageReactionListQueryInput,
    _: MessageReaction[]
  ): Promise<ChangeCheckResult<MessageReactionListQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'message_reaction_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.messageReaction.messageId === input.messageId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'message_reaction_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.messageReaction.messageId === input.messageId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchMessageReactions(
    input: MessageReactionListQueryInput
  ): Promise<MessageReaction[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const reactions = await workspace.database
      .selectFrom('message_reactions')
      .selectAll()
      .where('message_id', '=', input.messageId)
      .where('reaction', '=', input.reaction)
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return reactions.map((row) => {
      return {
        messageId: row.message_id,
        collaboratorId: row.collaborator_id,
        rootId: row.root_id,
        reaction: row.reaction,
        createdAt: row.created_at,
      };
    });
  }
}
