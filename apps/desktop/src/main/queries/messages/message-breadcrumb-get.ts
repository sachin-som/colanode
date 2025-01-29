import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { MessageBreadcrumbGetQueryInput } from '@/shared/queries/messages/message-breadcrumb-get';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { fetchMessageBreadcrumb } from '@/main/lib/utils';

export class MessageBreadcrumbGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<MessageBreadcrumbGetQueryInput>
{
  public async handleQuery(
    input: MessageBreadcrumbGetQueryInput
  ): Promise<string[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    return fetchMessageBreadcrumb(workspace.database, input.messageId);
  }

  public async checkForChanges(
    event: Event,
    input: MessageBreadcrumbGetQueryInput,
    output: string[]
  ): Promise<ChangeCheckResult<MessageBreadcrumbGetQueryInput>> {
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
      event.type === 'message_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.message.id === input.messageId
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'message_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.message.id === input.messageId
    ) {
      const messageId = output.find((id) => id === event.message.id);
      if (messageId) {
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
}
