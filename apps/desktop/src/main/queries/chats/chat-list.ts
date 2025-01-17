import { ChatEntry } from '@colanode/core';

import { SelectEntry } from '@/main/databases/workspace';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { ChatListQueryInput } from '@/shared/queries/chats/chat-list';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class ChatListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<ChatListQueryInput>
{
  public async handleQuery(input: ChatListQueryInput): Promise<ChatEntry[]> {
    const rows = await this.fetchChildren(input);
    return rows.map(mapEntry) as ChatEntry[];
  }

  public async checkForChanges(
    event: Event,
    input: ChatListQueryInput,
    output: ChatEntry[]
  ): Promise<ChangeCheckResult<ChatListQueryInput>> {
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
      event.type === 'entry_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.type === 'chat'
    ) {
      const newChildren = [...output, event.entry];
      return {
        hasChanges: true,
        result: newChildren,
      };
    }

    if (
      event.type === 'entry_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.type === 'chat'
    ) {
      const entry = output.find((entry) => entry.id === event.entry.id);
      if (entry) {
        const newChildren = output.map((entry) =>
          entry.id === event.entry.id ? (event.entry as ChatEntry) : entry
        );

        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    if (
      event.type === 'entry_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.type === 'chat'
    ) {
      const entry = output.find((entry) => entry.id === event.entry.id);
      if (entry) {
        const newChildren = output.filter(
          (entry) => entry.id !== event.entry.id
        );
        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchChildren(
    input: ChatListQueryInput
  ): Promise<SelectEntry[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const rows = await workspace.database
      .selectFrom('entries')
      .selectAll()
      .where('parent_id', 'is', null)
      .where('type', '=', 'chat')
      .execute();

    return rows;
  }
}
