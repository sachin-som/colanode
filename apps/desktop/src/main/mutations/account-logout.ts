import { databaseService } from '@/main/data/database-service';
import {
  AccountLogoutMutationInput,
  AccountLogoutMutationOutput,
} from '@/shared/mutations/account-logout';
import { MutationHandler } from '@/main/types';
import { accountService } from '@/main/services/account-service';

export class AccountLogoutMutationHandler
  implements MutationHandler<AccountLogoutMutationInput>
{
  async handleMutation(
    input: AccountLogoutMutationInput
  ): Promise<AccountLogoutMutationOutput> {
    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      return {
        success: false,
      };
    }

    await accountService.logoutAccount(account);
    return {
      success: true,
    };
  }
}
