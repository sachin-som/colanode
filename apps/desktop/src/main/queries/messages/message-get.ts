import { databaseService } from '@/main/data/database-service';
import { SelectMessage } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapMessage } from '@/main/utils';
import { MessageGetQueryInput } from '@/shared/queries/messages/message-get';
import { Event } from '@/shared/types/events';
import { MessageNode } from '@/shared/types/messages';

export class MessageGetQueryHandler
  implements QueryHandler<MessageGetQueryInput>
{
  public async handleQuery(
    input: MessageGetQueryInput
  ): Promise<MessageNode | null> {
    const row = await this.fetchMessage(input);
    return row ? mapMessage(row) : null;
  }

  public async checkForChanges(
    event: Event,
    input: MessageGetQueryInput,
    _: MessageNode | null
  ): Promise<ChangeCheckResult<MessageGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'message_created' &&
      event.userId === input.userId &&
      event.message.id === input.messageId
    ) {
      return {
        hasChanges: true,
        result: event.message,
      };
    }

    if (
      event.type === 'message_updated' &&
      event.userId === input.userId &&
      event.message.id === input.messageId
    ) {
      return {
        hasChanges: true,
        result: event.message,
      };
    }

    if (
      event.type === 'message_deleted' &&
      event.userId === input.userId &&
      event.message.id === input.messageId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchMessage(
    input: MessageGetQueryInput
  ): Promise<SelectMessage | undefined> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const row = await workspaceDatabase
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', input.messageId)
      .executeTakeFirst();

    return row;
  }
}
