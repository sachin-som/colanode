import { SelectAccount } from '@/main/databases/app';
import { appService } from '@/main/services/app-service';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapAccount } from '@/main/lib/mappers';
import { AccountListQueryInput } from '@/shared/queries/accounts/account-list';
import { Account } from '@/shared/types/accounts';
import { Event } from '@/shared/types/events';

export class AccountListQueryHandler
  implements QueryHandler<AccountListQueryInput>
{
  public async handleQuery(_: AccountListQueryInput): Promise<Account[]> {
    const rows = await this.fetchAccounts();
    return rows.map(mapAccount);
  }

  public async checkForChanges(
    event: Event,
    _: AccountListQueryInput,
    output: Account[]
  ): Promise<ChangeCheckResult<AccountListQueryInput>> {
    if (event.type === 'account_created') {
      const newAccounts = [...output, event.account];
      return {
        hasChanges: true,
        result: newAccounts,
      };
    }

    if (event.type === 'account_updated') {
      const updatedAccounts = [...output].map((account) => {
        if (account.id === event.account.id) {
          return event.account;
        }
        return account;
      });

      return {
        hasChanges: true,
        result: updatedAccounts,
      };
    }

    if (event.type === 'account_deleted') {
      const activeAccounts = [...output].filter(
        (account) => account.id !== event.account.id
      );

      return {
        hasChanges: true,
        result: activeAccounts,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchAccounts(): Promise<SelectAccount[]> {
    return appService.database.selectFrom('accounts').selectAll().execute();
  }
}
