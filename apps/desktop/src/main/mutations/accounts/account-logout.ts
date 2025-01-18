import { appService } from '@/main/services/app-service';
import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  AccountLogoutMutationInput,
  AccountLogoutMutationOutput,
} from '@/shared/mutations/accounts/account-logout';

export class AccountLogoutMutationHandler
  implements MutationHandler<AccountLogoutMutationInput>
{
  async handleMutation(
    input: AccountLogoutMutationInput
  ): Promise<AccountLogoutMutationOutput> {
    const account = appService.getAccount(input.accountId);

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account was not found or has been logged out already. Try closing the app and opening it again.'
      );
    }

    await account.logout();
    return {
      success: true,
    };
  }
}
