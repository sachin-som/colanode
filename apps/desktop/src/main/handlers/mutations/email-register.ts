import { LoginOutput } from '@/shared/types/accounts';
import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/shared/lib/http-client';
import {
  EmailRegisterMutationInput,
  EmailRegisterMutationOutput,
} from '@/shared/mutations/email-register';
import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';

export class EmailRegisterMutationHandler
  implements MutationHandler<EmailRegisterMutationInput>
{
  async handleMutation(
    input: EmailRegisterMutationInput
  ): Promise<EmailRegisterMutationOutput> {
    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', input.server)
      .executeTakeFirst();

    if (!server) {
      return {
        success: false,
      };
    }

    const { data } = await httpClient.post<LoginOutput>(
      '/v1/accounts/register/email',
      {
        name: input.name,
        email: input.email,
        password: input.password,
      },
      {
        serverDomain: server.domain,
        serverAttributes: server.attributes,
      }
    );

    await databaseService.appDatabase.transaction().execute(async (trx) => {
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
    });

    eventBus.publish({
      type: 'account_created',
      account: data.account,
    });

    if (data.workspaces.length > 0) {
      for (const workspace of data.workspaces) {
        eventBus.publish({
          type: 'workspace_created',
          workspace: {
            id: workspace.id,
            name: workspace.name,
            versionId: workspace.versionId,
            accountId: workspace.user.accountId,
            role: workspace.user.role,
            userId: workspace.user.id,
          },
        });
      }
    }

    return {
      success: true,
      account: data.account,
      workspaces: data.workspaces,
    };
  }
}
