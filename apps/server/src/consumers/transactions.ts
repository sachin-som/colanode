import {
  ConsumeTransactionsMessage,
  TransactionsBatchMessage,
} from '@colanode/core';

import { BaseConsumer } from '@/consumers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { mapTransaction } from '@/lib/nodes';
import { ConnectedUser } from '@/types/users';

export class TransactionsConsumer extends BaseConsumer {
  private readonly rootId: string;

  constructor(user: ConnectedUser, rootId: string) {
    super(user);
    this.rootId = rootId;
  }

  public processEvent(event: Event): void {
    if (event.type === 'node_created' && event.rootId === this.rootId) {
      this.fetchTransactions();
    } else if (event.type === 'node_updated' && event.rootId === this.rootId) {
      this.fetchTransactions();
    } else if (event.type === 'node_deleted' && event.rootId === this.rootId) {
      this.fetchTransactions();
    }
  }

  public async consume(message: ConsumeTransactionsMessage) {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = BigInt(message.cursor);
    if (this.status === 'idle') {
      this.cursor = cursor;
      this.status = 'pending';
      await this.fetchTransactions();
    } else if (this.status === 'pending' && this.cursor !== cursor) {
      this.cursor = cursor;
      await this.fetchTransactions();
    }
  }

  private async fetchTransactions() {
    if (this.cursor === null) {
      return;
    }

    if (this.status !== 'pending') {
      return;
    }

    this.status = 'fetching';
    const unsyncedTransactions = await database
      .selectFrom('transactions')
      .selectAll()
      .where('root_id', '=', this.rootId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedTransactions.length === 0) {
      this.status = 'pending';
      return;
    }

    const transactions = unsyncedTransactions.map(mapTransaction);
    const message: TransactionsBatchMessage = {
      type: 'transactions_batch',
      userId: this.user.userId,
      rootId: this.rootId,
      transactions,
    };

    this.status = 'idle';
    this.user.sendMessage(message);
  }
}
