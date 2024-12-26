import {
  SynchronizerOutputMessage,
  SyncFileInteractionsInput,
  SyncFileInteractionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectFileInteraction } from '@/data/schema';

export class FileInteractionSynchronizer extends BaseSynchronizer<SyncFileInteractionsInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncFileInteractionsInput> | null> {
    const fileInteractions = await this.fetchFileInteractions();
    if (fileInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(fileInteractions);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncFileInteractionsInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const fileInteractions = await this.fetchFileInteractions();
    if (fileInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(fileInteractions);
  }

  private async fetchFileInteractions() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const fileInteractions = await database
      .selectFrom('file_interactions')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return fileInteractions;
  }

  private buildMessage(
    unsyncedFileInteractions: SelectFileInteraction[]
  ): SynchronizerOutputMessage<SyncFileInteractionsInput> {
    const items: SyncFileInteractionData[] = unsyncedFileInteractions.map(
      (fileInteraction) => ({
        fileId: fileInteraction.file_id,
        collaboratorId: fileInteraction.collaborator_id,
        firstSeenAt: fileInteraction.first_seen_at?.toISOString() ?? null,
        lastSeenAt: fileInteraction.last_seen_at?.toISOString() ?? null,
        firstOpenedAt: fileInteraction.first_opened_at?.toISOString() ?? null,
        lastOpenedAt: fileInteraction.last_opened_at?.toISOString() ?? null,
        rootId: fileInteraction.root_id,
        workspaceId: fileInteraction.workspace_id,
        version: fileInteraction.version.toString(),
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
      event.type === 'file_interaction_updated' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
