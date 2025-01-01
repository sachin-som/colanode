import { SyncFileTombstonesInput, SyncFileTombstoneData } from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { fileService } from '@/main/services/file-service';

export class FileTombstoneSynchronizer extends BaseSynchronizer<SyncFileTombstonesInput> {
  protected async process(data: SyncFileTombstoneData): Promise<void> {
    await fileService.syncServerFileTombstone(this.userId, data);
  }

  protected get cursorKey(): string {
    return `file_tombstones:${this.input.rootId}`;
  }
}
