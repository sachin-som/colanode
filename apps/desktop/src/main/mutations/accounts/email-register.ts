import { LoginOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import {
  EmailRegisterMutationInput,
  EmailRegisterMutationOutput,
} from '@/shared/mutations/accounts/email-register';
import { MutationError } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { mapAccount, mapWorkspace } from '@/main/utils';

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
      throw new MutationError(
        'server_not_found',
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const { data } = await httpClient.post<LoginOutput>(
        '/v1/accounts/register/email',
        {
          name: input.name,
          email: input.email,
          password: input.password,
        },
        {
          domain: server.domain,
        }
      );

      const { createdAccount, createdWorkspaces } =
        await databaseService.appDatabase.transaction().execute(async (trx) => {
          const createdAccount = await trx
            .insertInto('accounts')
            .returningAll()
            .values({
              id: data.account.id,
              name: data.account.name,
              avatar: data.account.avatar,
              device_id: data.deviceId,
              email: data.account.email,
              token: data.token,
              server: server.domain,
              status: 'active',
            })
            .executeTakeFirst();

          if (!createdAccount) {
            throw new MutationError(
              'account_login_failed',
              'Failed to login with email and password! Please try again.'
            );
          }

          if (data.workspaces.length === 0) {
            return { createdAccount, createdWorkspaces: [] };
          }

          const createdWorkspaces = await trx
            .insertInto('workspaces')
            .returningAll()
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

          return { createdAccount, createdWorkspaces };
        });

      if (!createdAccount) {
        throw new MutationError(
          'account_login_failed',
          'Failed to login with email and password! Please try again.'
        );
      }

      const account = mapAccount(createdAccount);
      eventBus.publish({
        type: 'account_created',
        account,
      });

      if (createdWorkspaces.length > 0) {
        for (const workspace of createdWorkspaces) {
          eventBus.publish({
            type: 'workspace_created',
            workspace: mapWorkspace(workspace),
          });
        }
      }

      return {
        account,
        workspaces: data.workspaces,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError('api_error', apiError.message);
    }
  }
}
