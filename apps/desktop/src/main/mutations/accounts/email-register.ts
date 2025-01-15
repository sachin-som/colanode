import { EmailRegisterInput, LoginOutput } from '@colanode/core';

import { app } from 'electron';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { httpClient } from '@/shared/lib/http-client';
import { EmailRegisterMutationInput } from '@/shared/mutations/accounts/email-register';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { accountService } from '@/main/services/account-service';

export class EmailRegisterMutationHandler
  implements MutationHandler<EmailRegisterMutationInput>
{
  async handleMutation(
    input: EmailRegisterMutationInput
  ): Promise<LoginOutput> {
    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', input.server)
      .executeTakeFirst();

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailRegisterInput: EmailRegisterInput = {
        name: input.name,
        email: input.email,
        password: input.password,
        platform: process.platform,
        version: app.getVersion(),
      };

      const { data } = await httpClient.post<LoginOutput>(
        '/v1/accounts/emails/register',
        emailRegisterInput,
        {
          domain: server.domain,
        }
      );

      if (data.type === 'verify') {
        return data;
      }

      await accountService.initAccount(data, server.domain);
      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
