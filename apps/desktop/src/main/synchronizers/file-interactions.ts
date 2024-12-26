import {
  SyncFileInteractionsInput,
  SyncFileInteractionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { fileService } from '@/main/services/file-service';

export class FileInteractionSynchronizer extends BaseSynchronizer<SyncFileInteractionsInput> {
  protected async process(data: SyncFileInteractionData): Promise<void> {
    await fileService.syncServerFileInteraction(this.userId, data);
  }

  protected get cursorKey(): string {
    return `file_interactions:${this.input.rootId}`;
  }
}
