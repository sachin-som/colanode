import { databaseManager } from '@/main/data/database-manager';
import { httpClient } from '@/lib/http-client';
import { MutationHandler, MutationResult } from '@/main/types';
import { AccountUpdateOutput } from '@/types/accounts';
import { AccountUpdateMutationInput } from '@/operations/mutations/account-update';

export class AccountUpdateMutationHandler
  implements MutationHandler<AccountUpdateMutationInput>
{
  async handleMutation(
    input: AccountUpdateMutationInput
  ): Promise<MutationResult<AccountUpdateMutationInput>> {
    const account = await databaseManager.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!account) {
      throw new Error('Account not found!');
    }

    const server = await databaseManager.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Account not found');
    }

    const { data } = await httpClient.put<AccountUpdateOutput>(
      `/v1/accounts/${input.id}`,
      {
        name: input.name,
        avatar: input.avatar,
      },
      {
        serverDomain: server.domain,
        serverAttributes: server.attributes,
        token: account.token,
      }
    );

    await databaseManager.appDatabase
      .updateTable('accounts')
      .set({
        name: data.name,
        avatar: data.avatar,
      })
      .where('id', '=', input.id)
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
