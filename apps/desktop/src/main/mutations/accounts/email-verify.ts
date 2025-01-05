import { LoginOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { httpClient } from '@/shared/lib/http-client';
import { EmailVerifyMutationInput } from '@/shared/mutations/accounts/email-verify';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { accountService } from '@/main/services/account-service';

export class EmailVerifyMutationHandler
  implements MutationHandler<EmailVerifyMutationInput>
{
  async handleMutation(input: EmailVerifyMutationInput): Promise<LoginOutput> {
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
      const { data } = await httpClient.post<LoginOutput>(
        '/v1/accounts/emails/verify',
        {
          id: input.id,
          otp: input.otp,
        },
        {
          domain: server.domain,
        }
      );

      if (data.type === 'verify') {
        throw new MutationError(
          MutationErrorCode.EmailVerificationFailed,
          'Email verification failed! Please try again.'
        );
      }

      await accountService.initAccount(data, server.domain);

      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
