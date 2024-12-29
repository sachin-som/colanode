import {
  SynchronizerOutputMessage,
  SyncMessagesInput,
  SyncMessageData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectMessage } from '@/data/schema';

export class MessageSynchronizer extends BaseSynchronizer<SyncMessagesInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncMessagesInput> | null> {
    const messages = await this.fetchMessages();
    if (messages.length === 0) {
      return null;
    }

    return this.buildMessage(messages);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncMessagesInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const messages = await this.fetchMessages();
    if (messages.length === 0) {
      return null;
    }

    return this.buildMessage(messages);
  }

  private async fetchMessages() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const messages = await database
      .selectFrom('messages')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return messages;
  }

  private buildMessage(
    unsyncedMessages: SelectMessage[]
  ): SynchronizerOutputMessage<SyncMessagesInput> {
    const items: SyncMessageData[] = unsyncedMessages.map((message) => ({
      id: message.id,
      type: message.type,
      entryId: message.entry_id,
      parentId: message.parent_id,
      rootId: message.root_id,
      workspaceId: message.workspace_id,
      content: JSON.parse(message.content),
      createdAt: message.created_at.toISOString(),
      createdBy: message.created_by,
      updatedAt: message.updated_at?.toISOString() ?? null,
      updatedBy: message.updated_by ?? null,
      version: message.version.toString(),
    }));

    return {
      type: 'synchronizer_output',
      userId: this.user.userId,
      id: this.id,
      items: items.map((item) => ({
        cursor: item.version,
        data: item,
      })),
    };
  }

  private shouldFetch(event: Event) {
    if (
      event.type === 'message_created' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    if (
      event.type === 'message_updated' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    if (
      event.type === 'message_deleted' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
