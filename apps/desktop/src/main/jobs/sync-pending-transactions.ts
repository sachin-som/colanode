import { SyncTransactionsOutput, LocalTransaction } from '@colanode/core';

import { fetchWorkspaceCredentials, mapTransaction } from '@/main/utils';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { JobHandler } from '@/main/jobs';
import { httpClient } from '@/shared/lib/http-client';

export type SyncPendingTransactionsInput = {
  type: 'sync_pending_transactions';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_pending_transactions: {
      input: SyncPendingTransactionsInput;
    };
  }
}

export class SyncPendingTransactionsJobHandler
  implements JobHandler<SyncPendingTransactionsInput>
{
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  private readonly debug = createDebugger('job:sync-pending-transactions');

  public async handleJob(input: SyncPendingTransactionsInput) {
    this.debug(`Sending local pending transactions for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const unsyncedTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('status', '=', 'pending')
      .orderBy('id', 'asc')
      .limit(20)
      .execute();

    if (unsyncedTransactions.length === 0) {
      return;
    }

    this.debug(
      `Sending ${unsyncedTransactions.length} local pending transactions for user ${input.userId}`
    );

    const credentials = await fetchWorkspaceCredentials(input.userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${input.userId}, skipping sending local pending transactions`
      );
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping sending local pending transactions`
      );
      return;
    }

    const transactions: LocalTransaction[] =
      unsyncedTransactions.map(mapTransaction);
    const { data } = await httpClient.post<SyncTransactionsOutput>(
      `/v1/workspaces/${credentials.workspaceId}/transactions`,
      {
        transactions,
      },
      {
        domain: credentials.serverDomain,
        token: credentials.token,
      }
    );

    const syncedTransactionIds: string[] = [];
    const unsyncedTransactionIds: string[] = [];

    for (const result of data.results) {
      if (result.status === 'success') {
        syncedTransactionIds.push(result.id);
      } else {
        unsyncedTransactionIds.push(result.id);
      }
    }

    if (syncedTransactionIds.length > 0) {
      this.debug(
        `Marking ${syncedTransactionIds.length} local pending transactions as sent for user ${input.userId}`
      );

      await workspaceDatabase
        .updateTable('transactions')
        .set({ status: 'sent' })
        .where('id', 'in', syncedTransactionIds)
        .where('status', '=', 'pending')
        .execute();
    }

    if (unsyncedTransactionIds.length > 0) {
      this.debug(
        `Marking ${unsyncedTransactionIds.length} local pending transactions as failed for user ${input.userId}`
      );

      await workspaceDatabase
        .updateTable('transactions')
        .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
        .where('id', 'in', unsyncedTransactionIds)
        .where('status', '=', 'pending')
        .execute();
    }
  }
}
