import { nodeService } from '@/main/services/node-service';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { JobHandler } from '@/main/jobs';
import { mapTransaction } from '@/main/utils';

export type RevertInvalidTransactionsInput = {
  type: 'revert_invalid_transactions';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    revert_invalid_transactions: {
      input: RevertInvalidTransactionsInput;
    };
  }
}

export class RevertInvalidTransactionsJobHandler
  implements JobHandler<RevertInvalidTransactionsInput>
{
  public triggerDebounce = 100;
  public interval = 1000 * 60 * 5;

  private readonly debug = createDebugger('job:revert-invalid-transactions');

  public async handleJob(input: RevertInvalidTransactionsInput) {
    this.debug(`Reverting invalid transactions for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const invalidTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('status', '=', 'pending')
      .where('retry_count', '>=', 10)
      .execute();

    if (invalidTransactions.length === 0) {
      this.debug(
        `No invalid transactions found for user ${input.userId}, skipping`
      );
      return;
    }

    for (const transactionRow of invalidTransactions) {
      const transaction = mapTransaction(transactionRow);

      if (transaction.operation === 'create') {
        await nodeService.revertCreateTransaction(input.userId, transaction);
      } else if (transaction.operation === 'update') {
        await nodeService.revertUpdateTransaction(input.userId, transaction);
      } else if (transaction.operation === 'delete') {
        await nodeService.revertDeleteTransaction(input.userId, transaction);
      }
    }
  }
}
