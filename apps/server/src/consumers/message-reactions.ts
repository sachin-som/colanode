import {
  ConsumeMessageReactionsMessage,
  MessageReactionsBatchMessage,
} from '@colanode/core';

import { BaseConsumer } from '@/consumers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { mapMessageReaction } from '@/lib/nodes';
import { ConnectedUser } from '@/types/users';

export class MessageReactionsConsumer extends BaseConsumer {
  private readonly rootId: string;

  constructor(user: ConnectedUser, rootId: string) {
    super(user);
    this.rootId = rootId;
  }

  public processEvent(event: Event): void {
    if (
      event.type === 'message_reaction_created' &&
      event.rootId === this.rootId
    ) {
      this.fetchMessageReactions();
    } else if (
      event.type === 'message_reaction_deleted' &&
      event.rootId === this.rootId
    ) {
      this.fetchMessageReactions();
    }
  }

  public async consume(message: ConsumeMessageReactionsMessage) {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = BigInt(message.cursor);
    if (this.status === 'idle') {
      this.cursor = cursor;
      this.status = 'pending';
      await this.fetchMessageReactions();
    } else if (this.status === 'pending' && this.cursor !== cursor) {
      this.cursor = cursor;
      await this.fetchMessageReactions();
    }
  }

  private async fetchMessageReactions() {
    if (this.cursor === null) {
      return;
    }

    if (this.status !== 'pending') {
      return;
    }

    this.status = 'fetching';
    const unsyncedMessageReactions = await database
      .selectFrom('message_reactions')
      .selectAll()
      .where('root_id', '=', this.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedMessageReactions.length === 0) {
      this.status = 'pending';
      return;
    }

    const messageReactions = unsyncedMessageReactions.map(mapMessageReaction);
    const message: MessageReactionsBatchMessage = {
      type: 'message_reactions_batch',
      userId: this.user.userId,
      rootId: this.rootId,
      messageReactions,
    };

    this.status = 'idle';
    this.user.sendMessage(message);
  }
}
