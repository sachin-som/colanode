import { GetTransactionsOutput } from '@colanode/core';
import { sql } from 'kysely';

import { SelectTransaction } from '@/main/data/workspace/schema';
import { nodeService } from '@/main/services/node-service';
import { fetchCursor, fetchWorkspaceCredentials } from '@/main/utils';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { JobHandler } from '@/main/jobs';
import { httpClient } from '@/shared/lib/http-client';

export type SyncIncompleteTransactionsInput = {
  type: 'sync_incomplete_transactions';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_incomplete_transactions: {
      input: SyncIncompleteTransactionsInput;
    };
  }
}

export class SyncIncompleteTransactionsJobHandler
  implements JobHandler<SyncIncompleteTransactionsInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60;

  private readonly debug = createDebugger('job:sync-incomplete-transactions');

  public async handleJob(input: SyncIncompleteTransactionsInput) {
    this.debug(`Syncing incomplete transactions for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const incompleteTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('status', '=', 'incomplete')
      .execute();

    if (incompleteTransactions.length === 0) {
      this.debug(
        `No incomplete transactions found for user ${input.userId}, skipping`
      );
      return;
    }

    const credentials = await fetchWorkspaceCredentials(input.userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${input.userId}, skipping`
      );
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping`
      );
      return;
    }

    const groupedByNodeId = incompleteTransactions.reduce<
      Record<string, SelectTransaction[]>
    >((acc, transaction) => {
      acc[transaction.node_id] = [
        ...(acc[transaction.node_id] ?? []),
        transaction,
      ];
      return acc;
    }, {});

    for (const [nodeId, transactions] of Object.entries(groupedByNodeId)) {
      try {
        this.debug(
          `Syncing incomplete transactions for node ${nodeId} for user ${input.userId}`
        );

        const { data } = await httpClient.get<GetTransactionsOutput>(
          `/v1/workspaces/${credentials.workspaceId}/transactions/${nodeId}`,
          {
            domain: credentials.serverDomain,
            token: credentials.token,
          }
        );

        if (data.transactions.length === 0) {
          this.debug(
            `No transactions found for node ${nodeId} for user ${input.userId}, deleting`
          );

          await workspaceDatabase
            .deleteFrom('transactions')
            .where(
              'id',
              'in',
              transactions.map((t) => t.id)
            )
            .execute();
          continue;
        }

        const cursor = await fetchCursor(input.userId, 'transactions');
        const synced = await nodeService.replaceTransactions(
          input.userId,
          nodeId,
          data.transactions,
          cursor
        );

        if (!synced) {
          this.debug(
            `Failed to sync transactions for node ${nodeId} for user ${input.userId}, incrementing retry count`
          );

          await workspaceDatabase
            .updateTable('transactions')
            .set({ retry_count: sql`retry_count + 1` })
            .where(
              'id',
              'in',
              transactions.map((t) => t.id)
            )
            .execute();
        } else {
          this.debug(
            `Successfully synced transactions for node ${nodeId} for user ${input.userId}, resetting retry count`
          );

          await workspaceDatabase
            .updateTable('transactions')
            .set({ retry_count: sql`retry_count + 1` })
            .where(
              'id',
              'in',
              transactions.map((t) => t.id)
            )
            .where('status', '=', 'incomplete')
            .execute();
        }
      } catch (error) {
        this.debug(
          error,
          `Error syncing incomplete transactions for node ${nodeId} for user ${input.userId}`
        );
      }
    }
  }
}
