import { EmailLoginInput, LoginOutput } from '@colanode/core';

import { app } from 'electron';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { httpClient } from '@/shared/lib/http-client';
import { EmailLoginMutationInput } from '@/shared/mutations/accounts/email-login';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { accountService } from '@/main/services/account-service';

export class EmailLoginMutationHandler
  implements MutationHandler<EmailLoginMutationInput>
{
  async handleMutation(input: EmailLoginMutationInput): Promise<LoginOutput> {
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
      const emailLoginInput: EmailLoginInput = {
        email: input.email,
        password: input.password,
        platform: process.platform,
        version: app.getVersion(),
      };

      const { data } = await httpClient.post<LoginOutput>(
        '/v1/accounts/emails/login',
        emailLoginInput,
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
