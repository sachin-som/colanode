import { sql } from 'kysely';

import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { MessageReactionsAggregateQueryInput } from '@/shared/queries/messages/message-reactions-aggregate';
import { Event } from '@/shared/types/events';
import { MessageReactionCount } from '@/shared/types/messages';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

interface MessageReactionsAggregateRow {
  reaction: string;
  count: number;
  reacted: number;
}

export class MessageReactionsAggregateQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<MessageReactionsAggregateQueryInput>
{
  public async handleQuery(
    input: MessageReactionsAggregateQueryInput
  ): Promise<MessageReactionCount[]> {
    return this.fetchMessageReactions(input);
  }

  public async checkForChanges(
    event: Event,
    input: MessageReactionsAggregateQueryInput,
    _: MessageReactionCount[]
  ): Promise<ChangeCheckResult<MessageReactionsAggregateQueryInput>> {
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
    input: MessageReactionsAggregateQueryInput
  ): Promise<MessageReactionCount[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await sql<MessageReactionsAggregateRow>`
      SELECT 
        reaction,
        COUNT(reaction) as count,
        MAX(CASE 
          WHEN collaborator_id = ${workspace.userId} THEN 1 
          ELSE 0 
        END) as reacted
      FROM message_reactions
      WHERE message_id = ${input.messageId} AND deleted_at IS NULL
      GROUP BY reaction
    `.execute(workspace.database);

    if (result.rows.length === 0) {
      return [];
    }

    const counts = result.rows.map((row) => {
      return {
        reaction: row.reaction,
        count: row.count,
        reacted: row.reacted === 1,
      };
    });

    return counts;
  }
}
