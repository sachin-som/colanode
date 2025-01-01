import { compareString } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectMessage } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapMessage } from '@/main/utils';
import { MessageListQueryInput } from '@/shared/queries/messages/message-list';
import { Event } from '@/shared/types/events';
import { MessageNode } from '@/shared/types/messages';

export class MessageListQueryHandler
  implements QueryHandler<MessageListQueryInput>
{
  public async handleQuery(
    input: MessageListQueryInput
  ): Promise<MessageNode[]> {
    const messages = await this.fetchMesssages(input);
    return this.buildMessages(messages);
  }

  public async checkForChanges(
    event: Event,
    input: MessageListQueryInput,
    output: MessageNode[]
  ): Promise<ChangeCheckResult<MessageListQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'message_created' &&
      event.userId === input.userId &&
      event.message.parentId === input.conversationId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'message_updated' &&
      event.userId === input.userId &&
      event.message.parentId === input.conversationId
    ) {
      const message = output.find((message) => message.id === event.message.id);
      if (message) {
        const newResult = output.map((message) => {
          if (message.id === event.message.id) {
            return event.message;
          }
          return message;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'message_deleted' &&
      event.userId === input.userId &&
      event.message.parentId === input.conversationId
    ) {
      const message = output.find((message) => message.id === event.message.id);

      if (message) {
        const newOutput = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchMesssages(
    input: MessageListQueryInput
  ): Promise<SelectMessage[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const offset = (input.page - 1) * input.count;
    const messages = await workspaceDatabase
      .selectFrom('messages')
      .selectAll()
      .where('parent_id', '=', input.conversationId)
      .where('deleted_at', 'is', null)
      .orderBy('id', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return messages;
  }

  private buildMessages = (rows: SelectMessage[]): MessageNode[] => {
    const messages = rows.map(mapMessage);
    return messages.sort((a, b) => compareString(a.id, b.id));
  };
}
