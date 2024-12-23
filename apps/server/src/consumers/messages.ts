import { ConsumeMessagesMessage, MessagesBatchMessage } from '@colanode/core';

import { BaseConsumer } from '@/consumers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { mapMessage } from '@/lib/nodes';
import { ConnectedUser } from '@/types/users';

export class MessagesConsumer extends BaseConsumer {
  private readonly rootId: string;

  constructor(user: ConnectedUser, rootId: string) {
    super(user);
    this.rootId = rootId;
  }

  public processEvent(event: Event): void {
    if (event.type === 'message_created' && event.rootId === this.rootId) {
      this.fetchMessages();
    } else if (
      event.type === 'message_updated' &&
      event.rootId === this.rootId
    ) {
      this.fetchMessages();
    } else if (
      event.type === 'message_deleted' &&
      event.rootId === this.rootId
    ) {
      this.fetchMessages();
    }
  }

  public async consume(message: ConsumeMessagesMessage) {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = BigInt(message.cursor);
    if (this.status === 'idle') {
      this.cursor = cursor;
      this.status = 'pending';
      await this.fetchMessages();
    } else if (this.status === 'pending' && this.cursor !== cursor) {
      this.cursor = cursor;
      await this.fetchMessages();
    }
  }

  private async fetchMessages() {
    if (this.cursor === null) {
      return;
    }

    if (this.status !== 'pending') {
      return;
    }

    this.status = 'fetching';
    const unsyncedMessages = await database
      .selectFrom('messages')
      .selectAll()
      .where('root_id', '=', this.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedMessages.length === 0) {
      this.status = 'pending';
      return;
    }

    const messages = unsyncedMessages.map(mapMessage);
    const message: MessagesBatchMessage = {
      type: 'messages_batch',
      userId: this.user.userId,
      rootId: this.rootId,
      messages,
    };

    this.status = 'idle';
    this.user.sendMessage(message);
  }
}
