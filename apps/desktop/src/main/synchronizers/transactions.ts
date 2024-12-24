import { SyncTransactionData, SyncTransactionsInput } from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { entryService } from '@/main/services/entry-service';

export class TransactionSynchronizer extends BaseSynchronizer<SyncTransactionsInput> {
  protected async process(data: SyncTransactionData): Promise<void> {
    await entryService.applyServerTransaction(this.userId, data);
  }

  protected get cursorKey(): string {
    return `transactions:${this.input.rootId}`;
  }
}
