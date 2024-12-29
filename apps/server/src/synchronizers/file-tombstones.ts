import {
  SynchronizerOutputMessage,
  SyncFileTombstonesInput,
  SyncFileTombstoneData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectFileTombstone } from '@/data/schema';

export class FileTombstoneSynchronizer extends BaseSynchronizer<SyncFileTombstonesInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncFileTombstonesInput> | null> {
    const fileTombstones = await this.fetchFileTombstones();
    if (fileTombstones.length === 0) {
      return null;
    }

    return this.buildMessage(fileTombstones);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncFileTombstonesInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const fileTombstones = await this.fetchFileTombstones();
    if (fileTombstones.length === 0) {
      return null;
    }

    return this.buildMessage(fileTombstones);
  }

  private async fetchFileTombstones() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const fileTombstones = await database
      .selectFrom('file_tombstones')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return fileTombstones;
  }

  private buildMessage(
    unsyncedFileTombstones: SelectFileTombstone[]
  ): SynchronizerOutputMessage<SyncFileTombstonesInput> {
    const items: SyncFileTombstoneData[] = unsyncedFileTombstones.map(
      (fileTombstone) => ({
        id: fileTombstone.id,
        rootId: fileTombstone.root_id,
        workspaceId: fileTombstone.workspace_id,
        deletedAt: fileTombstone.deleted_at.toISOString(),
        deletedBy: fileTombstone.deleted_by,
        version: fileTombstone.version.toString(),
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
    if (event.type === 'file_deleted' && event.rootId === this.input.rootId) {
      return true;
    }

    return false;
  }
}
