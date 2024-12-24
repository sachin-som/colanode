import {
  SynchronizerOutputMessage,
  SyncMessageReactionsInput,
  SyncMessageReactionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectMessageReaction } from '@/data/schema';

export class MessageReactionSynchronizer extends BaseSynchronizer<SyncMessageReactionsInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncMessageReactionsInput> | null> {
    const messageReactions = await this.fetchMessageReactions();
    if (messageReactions.length === 0) {
      return null;
    }

    return this.buildMessage(messageReactions);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncMessageReactionsInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const messageReactions = await this.fetchMessageReactions();
    if (messageReactions.length === 0) {
      return null;
    }

    return this.buildMessage(messageReactions);
  }

  private async fetchMessageReactions() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const messageReactions = await database
      .selectFrom('message_reactions')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return messageReactions;
  }

  private buildMessage(
    unsyncedMessageReactions: SelectMessageReaction[]
  ): SynchronizerOutputMessage<SyncMessageReactionsInput> {
    const items: SyncMessageReactionData[] = unsyncedMessageReactions.map(
      (messageReaction) => ({
        messageId: messageReaction.message_id,
        collaboratorId: messageReaction.collaborator_id,
        reaction: messageReaction.reaction,
        rootId: messageReaction.root_id,
        workspaceId: messageReaction.workspace_id,
        createdAt: messageReaction.created_at.toISOString(),
        deletedAt: messageReaction.deleted_at?.toISOString() ?? null,
        version: messageReaction.version.toString(),
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
      event.type === 'message_reaction_created' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    if (
      event.type === 'message_reaction_deleted' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
