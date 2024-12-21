import { Kysely } from 'kysely';
import {
  ConsumeTransactionsMessage,
  TransactionsBatchMessage,
} from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { createDebugger } from '@/main/debugger';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { BaseConsumer } from '@/main/consumers/base';

export class TransactionsConsumer extends BaseConsumer {
  private readonly debug = createDebugger('consumer:transactions');
  private readonly rootId: string;

  constructor(
    userId: string,
    accountId: string,
    rootId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ) {
    super(userId, accountId, workspaceDatabase);
    this.rootId = rootId;
  }

  protected get cursorKey(): string {
    return `transactions:${this.rootId}`;
  }

  public async init() {
    await super.initCursor();
    this.requestTransactions();
  }

  public async processTransactions(message: TransactionsBatchMessage) {
    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server transactions already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server transactions for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const transaction of message.transactions) {
        await nodeService.applyServerTransaction(message.userId, transaction);
        cursor = BigInt(transaction.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server transactions for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server transactions completed for user ${message.userId}`
      );

      if (cursor) {
        await this.setCursor(cursor);
      }

      this.status = 'idle';
      this.requestTransactions();
    }
  }

  private async requestTransactions() {
    const message: ConsumeTransactionsMessage = {
      type: 'consume_transactions',
      userId: this.userId,
      rootId: this.rootId,
      cursor: this.cursor.toString(),
    };

    this.sendMessage(message);
  }
}
