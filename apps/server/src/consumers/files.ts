import { ConsumeFilesMessage, FilesBatchMessage } from '@colanode/core';

import { BaseConsumer } from '@/consumers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { mapFile } from '@/lib/nodes';
import { ConnectedUser } from '@/types/users';

export class FilesConsumer extends BaseConsumer {
  private readonly rootId: string;

  constructor(user: ConnectedUser, rootId: string) {
    super(user);
    this.rootId = rootId;
  }

  public processEvent(event: Event): void {
    if (event.type === 'file_created' && event.rootId === this.rootId) {
      this.fetchFiles();
    } else if (event.type === 'file_updated' && event.rootId === this.rootId) {
      this.fetchFiles();
    } else if (event.type === 'file_deleted' && event.rootId === this.rootId) {
      this.fetchFiles();
    }
  }

  public async consume(message: ConsumeFilesMessage) {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = BigInt(message.cursor);
    if (this.status === 'idle') {
      this.cursor = cursor;
      this.status = 'pending';
      await this.fetchFiles();
    } else if (this.status === 'pending' && this.cursor !== cursor) {
      this.cursor = cursor;
      await this.fetchFiles();
    }
  }

  private async fetchFiles() {
    if (this.cursor === null) {
      return;
    }

    if (this.status !== 'pending') {
      return;
    }

    this.status = 'fetching';
    const unsyncedFiles = await database
      .selectFrom('files')
      .selectAll()
      .where('root_id', '=', this.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedFiles.length === 0) {
      this.status = 'pending';
      return;
    }

    const files = unsyncedFiles.map(mapFile);
    const message: FilesBatchMessage = {
      type: 'files_batch',
      userId: this.user.userId,
      rootId: this.rootId,
      files,
    };

    this.status = 'idle';
    this.user.sendMessage(message);
  }
}
