import { databaseManager } from '@/main/data/database-manager';
import { LogoutMutationInput } from '@/operations/mutations/logout';
import { MutationHandler, MutationResult } from '@/operations/mutations';

export class LogoutMutationHandler
  implements MutationHandler<LogoutMutationInput>
{
  async handleMutation(
    input: LogoutMutationInput,
  ): Promise<MutationResult<LogoutMutationInput>> {
    const account = await databaseManager.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      return {
        output: {
          success: false,
        },
      };
    }

    await databaseManager.appDatabase
      .updateTable('accounts')
      .set({
        status: 'logged_out',
      })
      .where('id', '=', input.accountId)
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'app',
          table: 'accounts',
        },
      ],
    };
  }
}
