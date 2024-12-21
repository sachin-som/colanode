import {
  ConsumeInteractionsMessage,
  InteractionsBatchMessage,
} from '@colanode/core';

import { BaseConsumer } from '@/consumers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { mapInteraction } from '@/lib/nodes';
import { ConnectedUser } from '@/types/users';

export class InteractionsConsumer extends BaseConsumer {
  private readonly rootId: string;

  constructor(user: ConnectedUser, rootId: string) {
    super(user);
    this.rootId = rootId;
  }

  public processEvent(event: Event): void {
    if (event.type === 'interaction_updated' && event.rootId === this.rootId) {
      this.fetchInteractions();
    }
  }

  public async consume(message: ConsumeInteractionsMessage) {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = BigInt(message.cursor);
    if (this.status === 'idle') {
      this.cursor = cursor;
      this.status = 'pending';
      await this.fetchInteractions();
    } else if (this.status === 'pending' && this.cursor !== cursor) {
      this.cursor = cursor;
      await this.fetchInteractions();
    }
  }

  private async fetchInteractions() {
    if (this.cursor === null) {
      return;
    }

    if (this.status !== 'pending') {
      return;
    }

    this.status = 'fetching';
    const unsyncedInteractions = await database
      .selectFrom('interactions')
      .selectAll()
      .where('node_id', '=', this.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedInteractions.length === 0) {
      this.status = 'pending';
      return;
    }

    const interactions = unsyncedInteractions.map(mapInteraction);
    const message: InteractionsBatchMessage = {
      type: 'interactions_batch',
      userId: this.user.userId,
      rootId: this.rootId,
      interactions,
    };

    this.status = 'idle';
    this.user.sendMessage(message);
  }
}
