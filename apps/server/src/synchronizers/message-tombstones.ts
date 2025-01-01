import {
  SynchronizerOutputMessage,
  SyncMessageTombstonesInput,
  SyncMessageTombstoneData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectMessageTombstone } from '@/data/schema';

export class MessageTombstoneSynchronizer extends BaseSynchronizer<SyncMessageTombstonesInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncMessageTombstonesInput> | null> {
    const messageTombstones = await this.fetchMessageTombstones();
    if (messageTombstones.length === 0) {
      return null;
    }

    return this.buildMessage(messageTombstones);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncMessageTombstonesInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const messageTombstones = await this.fetchMessageTombstones();
    if (messageTombstones.length === 0) {
      return null;
    }

    return this.buildMessage(messageTombstones);
  }

  private async fetchMessageTombstones() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const messageTombstones = await database
      .selectFrom('message_tombstones')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return messageTombstones;
  }

  private buildMessage(
    unsyncedMessageTombstones: SelectMessageTombstone[]
  ): SynchronizerOutputMessage<SyncMessageTombstonesInput> {
    const items: SyncMessageTombstoneData[] = unsyncedMessageTombstones.map(
      (messageTombstone) => ({
        id: messageTombstone.id,
        rootId: messageTombstone.root_id,
        workspaceId: messageTombstone.workspace_id,
        deletedAt: messageTombstone.deleted_at.toISOString(),
        deletedBy: messageTombstone.deleted_by,
        version: messageTombstone.version.toString(),
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
      event.type === 'message_deleted' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
