import {
  SynchronizerOutputMessage,
  SyncFilesInput,
  SyncFileData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectFile } from '@/data/schema';

export class FileSynchronizer extends BaseSynchronizer<SyncFilesInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncFilesInput> | null> {
    const files = await this.fetchFiles();
    if (files.length === 0) {
      return null;
    }

    return this.buildMessage(files);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncFilesInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const files = await this.fetchFiles();
    if (files.length === 0) {
      return null;
    }

    return this.buildMessage(files);
  }

  private async fetchFiles() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const files = await database
      .selectFrom('files')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return files;
  }

  private buildMessage(
    unsyncedFiles: SelectFile[]
  ): SynchronizerOutputMessage<SyncFilesInput> {
    const items: SyncFileData[] = unsyncedFiles.map((file) => ({
      id: file.id,
      type: file.type,
      parentId: file.parent_id,
      rootId: file.root_id,
      workspaceId: file.workspace_id,
      name: file.name,
      originalName: file.original_name,
      mimeType: file.mime_type,
      size: file.size,
      extension: file.extension,
      createdAt: file.created_at.toISOString(),
      createdBy: file.created_by,
      updatedAt: file.updated_at?.toISOString() ?? null,
      updatedBy: file.updated_by ?? null,
      deletedAt: file.deleted_at?.toISOString() ?? null,
      deletedBy: file.deleted_by ?? null,
      version: file.version.toString(),
      status: file.status,
    }));

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
    if (event.type === 'file_created' && event.rootId === this.input.rootId) {
      return true;
    }

    if (event.type === 'file_updated' && event.rootId === this.input.rootId) {
      return true;
    }

    if (event.type === 'file_deleted' && event.rootId === this.input.rootId) {
      return true;
    }

    return false;
  }
}
