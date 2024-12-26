import {
  SynchronizerOutputMessage,
  SyncEntryInteractionsInput,
  SyncEntryInteractionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectEntryInteraction } from '@/data/schema';

export class EntryInteractionSynchronizer extends BaseSynchronizer<SyncEntryInteractionsInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncEntryInteractionsInput> | null> {
    const entryInteractions = await this.fetchEntryInteractions();
    if (entryInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(entryInteractions);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncEntryInteractionsInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const entryInteractions = await this.fetchEntryInteractions();
    if (entryInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(entryInteractions);
  }

  private async fetchEntryInteractions() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const entryInteractions = await database
      .selectFrom('entry_interactions')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return entryInteractions;
  }

  private buildMessage(
    unsyncedEntryInteractions: SelectEntryInteraction[]
  ): SynchronizerOutputMessage<SyncEntryInteractionsInput> {
    const items: SyncEntryInteractionData[] = unsyncedEntryInteractions.map(
      (entryInteraction) => ({
        entryId: entryInteraction.entry_id,
        collaboratorId: entryInteraction.collaborator_id,
        firstSeenAt: entryInteraction.first_seen_at?.toISOString() ?? null,
        lastSeenAt: entryInteraction.last_seen_at?.toISOString() ?? null,
        firstOpenedAt: entryInteraction.first_opened_at?.toISOString() ?? null,
        lastOpenedAt: entryInteraction.last_opened_at?.toISOString() ?? null,
        rootId: entryInteraction.root_id,
        workspaceId: entryInteraction.workspace_id,
        version: entryInteraction.version.toString(),
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
      event.type === 'entry_interaction_updated' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
