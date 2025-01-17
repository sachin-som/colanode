import { sql } from 'kysely';

import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { MessageReactionsGetQueryInput } from '@/shared/queries/messages/message-reactions-get';
import { Event } from '@/shared/types/events';
import { MessageReactionsCount } from '@/shared/types/messages';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

interface MessageReactionsCountRow {
  reaction: string;
  count: number;
  reacted: number;
}

export class MessageReactionsGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<MessageReactionsGetQueryInput>
{
  public async handleQuery(
    input: MessageReactionsGetQueryInput
  ): Promise<MessageReactionsCount[]> {
    return this.fetchMessageReactions(input);
  }

  public async checkForChanges(
    event: Event,
    input: MessageReactionsGetQueryInput,
    _: MessageReactionsCount[]
  ): Promise<ChangeCheckResult<MessageReactionsGetQueryInput>> {
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
    input: MessageReactionsGetQueryInput
  ): Promise<MessageReactionsCount[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await sql<MessageReactionsCountRow>`
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
