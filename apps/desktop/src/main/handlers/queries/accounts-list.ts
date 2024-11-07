import { AccountListQueryInput } from '@/operations/queries/account-list';
import { databaseManager } from '@/main/data/database-manager';
import { Account } from '@/types/accounts';
import { SelectAccount } from '@/main/data/app/schema';
import { isEqual } from 'lodash';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';

export class AccountListQueryHandler
  implements QueryHandler<AccountListQueryInput>
{
  public async handleQuery(
    _: AccountListQueryInput
  ): Promise<QueryResult<AccountListQueryInput>> {
    const rows = await this.fetchAccounts();
    return {
      output: this.buildAccounts(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    _: AccountListQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<AccountListQueryInput>> {
    if (
      !changes.some(
        (change) => change.type === 'app' && change.table === 'accounts'
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchAccounts();
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildAccounts(rows),
        state: {
          rows,
        },
      },
    };
  }

  private fetchAccounts(): Promise<SelectAccount[]> {
    return databaseManager.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('status', '=', 'active')
      .execute();
  }

  private buildAccounts(rows: SelectAccount[]): Account[] {
    return rows.map((row) => {
      return {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        token: row.token,
        email: row.email,
        deviceId: row.device_id,
        status: row.status,
        server: row.server,
      };
    });
  }
}
