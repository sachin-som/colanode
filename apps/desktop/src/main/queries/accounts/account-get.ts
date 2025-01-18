import { SelectAccount } from '@/main/databases/app';
import { appService } from '@/main/services/app-service';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapAccount } from '@/main/lib/mappers';
import { AccountGetQueryInput } from '@/shared/queries/accounts/account-get';
import { Account } from '@/shared/types/accounts';
import { Event } from '@/shared/types/events';

export class AccountGetQueryHandler
  implements QueryHandler<AccountGetQueryInput>
{
  public async handleQuery(
    input: AccountGetQueryInput
  ): Promise<Account | null> {
    const row = await this.fetchAccount(input.accountId);
    if (!row) {
      return null;
    }

    return mapAccount(row);
  }

  public async checkForChanges(
    event: Event,
    input: AccountGetQueryInput
  ): Promise<ChangeCheckResult<AccountGetQueryInput>> {
    if (
      event.type === 'account_created' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: event.account,
      };
    }

    if (
      event.type === 'account_updated' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: event.account,
      };
    }

    if (
      event.type === 'account_deleted' &&
      event.account.id === input.accountId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchAccount(accountId: string): Promise<SelectAccount | undefined> {
    return appService.database
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', accountId)
      .executeTakeFirst();
  }
}
