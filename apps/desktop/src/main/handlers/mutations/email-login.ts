import { LoginOutput } from '@/types/accounts';
import { databaseManager } from '@/main/data/database-manager';
import { EmailLoginMutationInput } from '@/operations/mutations/email-login';
import { MutationChange, MutationHandler, MutationResult } from '@/main/types';
import { httpClient } from '@/lib/http-client';

export class EmailLoginMutationHandler
  implements MutationHandler<EmailLoginMutationInput>
{
  async handleMutation(
    input: EmailLoginMutationInput
  ): Promise<MutationResult<EmailLoginMutationInput>> {
    const server = await databaseManager.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', input.server)
      .executeTakeFirst();

    if (!server) {
      return {
        output: {
          success: false,
        },
      };
    }

    const { data } = await httpClient.post<LoginOutput>(
      '/v1/accounts/login/email',
      {
        email: input.email,
        password: input.password,
      },
      {
        serverDomain: server.domain,
        serverAttributes: server.attributes,
      }
    );

    const changedTables: MutationChange[] = [];
    await databaseManager.appDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('accounts')
        .values({
          id: data.account.id,
          name: data.account.name,
          avatar: data.account.avatar,
          device_id: data.account.deviceId,
          email: data.account.email,
          token: data.account.token,
          server: server.domain,
          status: 'active',
        })
        .execute();

      changedTables.push({
        type: 'app',
        table: 'accounts',
      });

      if (data.workspaces.length === 0) {
        return;
      }

      await trx
        .insertInto('workspaces')
        .values(
          data.workspaces.map((workspace) => ({
            workspace_id: workspace.id,
            name: workspace.name,
            account_id: data.account.id,
            avatar: workspace.avatar,
            role: workspace.user.role,
            description: workspace.description,
            user_id: workspace.user.id,
            version_id: workspace.versionId,
          }))
        )
        .execute();

      changedTables.push({
        type: 'app',
        table: 'workspaces',
      });
    });

    return {
      output: {
        success: true,
        account: data.account,
        workspaces: data.workspaces,
      },
      changes: changedTables,
    };
  }
}
