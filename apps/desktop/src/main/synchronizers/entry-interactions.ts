import {
  SyncEntryInteractionsInput,
  SyncEntryInteractionData,
} from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { entryService } from '@/main/services/entry-service';

export class EntryInteractionSynchronizer extends BaseSynchronizer<SyncEntryInteractionsInput> {
  protected async process(data: SyncEntryInteractionData): Promise<void> {
    await entryService.syncServerEntryInteraction(this.userId, data);
  }

  protected get cursorKey(): string {
    return `entry_interactions:${this.input.rootId}`;
  }
}
