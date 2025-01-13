import {
  SynchronizerOutputMessage,
  SyncMessageInteractionsInput,
  SyncMessageInteractionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectMessageInteraction } from '@/data/schema';

export class MessageInteractionSynchronizer extends BaseSynchronizer<SyncMessageInteractionsInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncMessageInteractionsInput> | null> {
    const messageInteractions = await this.fetchMessageInteractions();
    if (messageInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(messageInteractions);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncMessageInteractionsInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const messageInteractions = await this.fetchMessageInteractions();
    if (messageInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(messageInteractions);
  }

  private async fetchMessageInteractions() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const messageInteractions = await database
      .selectFrom('message_interactions')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return messageInteractions;
  }

  private buildMessage(
    unsyncedMessageInteractions: SelectMessageInteraction[]
  ): SynchronizerOutputMessage<SyncMessageInteractionsInput> {
    const items: SyncMessageInteractionData[] = unsyncedMessageInteractions.map(
      (messageInteraction) => ({
        messageId: messageInteraction.message_id,
        collaboratorId: messageInteraction.collaborator_id,
        firstSeenAt: messageInteraction.first_seen_at?.toISOString() ?? null,
        lastSeenAt: messageInteraction.last_seen_at?.toISOString() ?? null,
        firstOpenedAt:
          messageInteraction.first_opened_at?.toISOString() ?? null,
        lastOpenedAt: messageInteraction.last_opened_at?.toISOString() ?? null,
        rootId: messageInteraction.root_id,
        workspaceId: messageInteraction.workspace_id,
        version: messageInteraction.version.toString(),
      })
    );

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
      event.type === 'message_interaction_updated' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
