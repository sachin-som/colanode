import { LoginOutput } from '@/types/accounts';
import { databaseContext } from '@/main/data/database-context';
import { buildAxiosInstance } from '@/lib/servers';
import { EmailLoginMutationInput } from '@/types/mutations/email-login';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';

export class EmailLoginMutationHandler
  implements MutationHandler<EmailLoginMutationInput>
{
  async handleMutation(
    input: EmailLoginMutationInput,
  ): Promise<MutationResult<EmailLoginMutationInput>> {
    const server = await databaseContext.appDatabase
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

    const axios = buildAxiosInstance(server.domain, server.attributes);
    const { data } = await axios.post<LoginOutput>('/v1/accounts/login/email', {
      email: input.email,
      password: input.password,
    });

    const changedTables: MutationChange[] = [];
    await databaseContext.appDatabase.transaction().execute(async (trx) => {
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
            id: workspace.id,
            name: workspace.name,
            account_id: data.account.id,
            avatar: workspace.avatar,
            role: workspace.role,
            description: workspace.description,
            synced: 0,
            user_id: workspace.userId,
            version_id: workspace.versionId,
          })),
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
      },
      changes: changedTables,
    };
  }
}
