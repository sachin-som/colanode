import {
  SynchronizerOutputMessage,
  SyncTransactionsInput,
  SyncTransactionData,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectTransaction } from '@/data/schema';

export class TransactionSynchronizer extends BaseSynchronizer<SyncTransactionsInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncTransactionsInput> | null> {
    const transactions = await this.fetchTransactions();
    if (transactions.length === 0) {
      return null;
    }

    return this.buildMessage(transactions);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncTransactionsInput> | null> {
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
      .selectFrom('transactions')
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
    unsyncedTransactions: SelectTransaction[]
  ): SynchronizerOutputMessage<SyncTransactionsInput> {
    const items: SyncTransactionData[] = unsyncedTransactions.map(
      (transaction) => {
        if (transaction.operation === 'create' && transaction.data) {
          return {
            id: transaction.id,
            operation: 'create',
            nodeId: transaction.node_id,
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
            nodeId: transaction.node_id,
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
            nodeId: transaction.node_id,
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
    if (
      event.type === 'message_created' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    if (
      event.type === 'message_updated' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    if (
      event.type === 'message_deleted' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
