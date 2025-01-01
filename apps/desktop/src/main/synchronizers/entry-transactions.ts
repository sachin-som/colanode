import {
  SyncEntryTransactionData,
  SyncEntryTransactionsInput,
} from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { entryService } from '@/main/services/entry-service';

export class EntryTransactionSynchronizer extends BaseSynchronizer<SyncEntryTransactionsInput> {
  protected async process(data: SyncEntryTransactionData): Promise<void> {
    await entryService.applyServerTransaction(this.userId, data);
  }

  protected get cursorKey(): string {
    return `entry_transactions:${this.input.rootId}`;
  }
}
