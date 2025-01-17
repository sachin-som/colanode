import { SelectMessage } from '@/main/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapMessage } from '@/main/utils';
import { MessageGetQueryInput } from '@/shared/queries/messages/message-get';
import { Event } from '@/shared/types/events';
import { MessageNode } from '@/shared/types/messages';

export class MessageGetQueryHandler
  extends WorkspaceQueryHandlerBase
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
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'message_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.message.id === input.messageId
    ) {
      return {
        hasChanges: true,
        result: event.message,
      };
    }

    if (
      event.type === 'message_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.message.id === input.messageId
    ) {
      return {
        hasChanges: true,
        result: event.message,
      };
    }

    if (
      event.type === 'message_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
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
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const row = await workspace.database
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', input.messageId)
      .executeTakeFirst();

    return row;
  }
}
