import {
  SynchronizerOutputMessage,
  SyncEntryTransactionsInput,
  SyncEntryTransactionData,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectEntryTransaction } from '@/data/schema';

export class EntryTransactionSynchronizer extends BaseSynchronizer<SyncEntryTransactionsInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncEntryTransactionsInput> | null> {
    const transactions = await this.fetchTransactions();
    if (transactions.length === 0) {
      return null;
    }

    return this.buildMessage(transactions);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncEntryTransactionsInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const transactions = await this.fetchTransactions();
    if (transactions.length === 0) {
      return null;
    }

    return this.buildMessage(transactions);
  }

  private async fetchTransactions() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const transactions = await database
      .selectFrom('entry_transactions')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return transactions;
  }

  private buildMessage(
    unsyncedTransactions: SelectEntryTransaction[]
  ): SynchronizerOutputMessage<SyncEntryTransactionsInput> {
    const items: SyncEntryTransactionData[] = unsyncedTransactions.map(
      (transaction) => {
        if (transaction.operation === 'create' && transaction.data) {
          return {
            id: transaction.id,
            operation: 'create',
            entryId: transaction.entry_id,
            rootId: transaction.root_id,
            workspaceId: transaction.workspace_id,
            data: encodeState(transaction.data),
            createdAt: transaction.created_at.toISOString(),
            createdBy: transaction.created_by,
            serverCreatedAt: transaction.server_created_at.toISOString(),
            version: transaction.version.toString(),
          };
        }

        if (transaction.operation === 'update' && transaction.data) {
          return {
            id: transaction.id,
            operation: 'update',
            entryId: transaction.entry_id,
            rootId: transaction.root_id,
            workspaceId: transaction.workspace_id,
            data: encodeState(transaction.data),
            createdAt: transaction.created_at.toISOString(),
            createdBy: transaction.created_by,
            serverCreatedAt: transaction.server_created_at.toISOString(),
            version: transaction.version.toString(),
          };
        }

        if (transaction.operation === 'delete') {
          return {
            id: transaction.id,
            operation: 'delete',
            entryId: transaction.entry_id,
            rootId: transaction.root_id,
            workspaceId: transaction.workspace_id,
            createdAt: transaction.created_at.toISOString(),
            createdBy: transaction.created_by,
            serverCreatedAt: transaction.server_created_at.toISOString(),
            version: transaction.version.toString(),
          };
        }

        throw new Error('Unknown transaction type');
      }
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
    if (event.type === 'entry_created' && event.rootId === this.input.rootId) {
      return true;
    }

    if (event.type === 'entry_updated' && event.rootId === this.input.rootId) {
      return true;
    }

    if (event.type === 'entry_deleted' && event.rootId === this.input.rootId) {
      return true;
    }

    return false;
  }
}
