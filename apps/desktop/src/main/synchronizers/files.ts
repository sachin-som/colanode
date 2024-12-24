import { SyncFilesInput, SyncFileData } from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { fileService } from '@/main/services/file-service';

export class FileSynchronizer extends BaseSynchronizer<SyncFilesInput> {
  protected async process(data: SyncFileData): Promise<void> {
    await fileService.syncServerFile(this.userId, data);
  }

  protected get cursorKey(): string {
    return `files:${this.input.rootId}`;
  }
}
