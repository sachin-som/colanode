import { ChatEntry } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectEntry } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { ChatListQueryInput } from '@/shared/queries/chats/chat-list';
import { Event } from '@/shared/types/events';

export class ChatListQueryHandler implements QueryHandler<ChatListQueryInput> {
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
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'entry_created' &&
      event.userId === input.userId &&
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
      event.userId === input.userId &&
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
      event.userId === input.userId &&
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
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('parent_id', 'is', null)
      .where('type', '=', 'chat')
      .execute();

    return rows;
  }
}
