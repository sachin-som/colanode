import { EmailVerifyInput, LoginOutput } from '@colanode/core';
import axios from 'axios';

import { MutationHandler } from '@/main/lib/types';
import { EmailVerifyMutationInput } from '@/shared/mutations/accounts/email-verify';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { appService } from '@/main/services/app-service';
import { AccountMutationHandlerBase } from '@/main/mutations/accounts/base';
export class EmailVerifyMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailVerifyMutationInput>
{
  async handleMutation(input: EmailVerifyMutationInput): Promise<LoginOutput> {
    const server = appService.getServer(input.server);

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        `Server ${input.server} was not found! Try using a different server.`
      );
    }

    try {
      const emailVerifyInput: EmailVerifyInput = {
        id: input.id,
        otp: input.otp,
        platform: process.platform,
        version: appService.version,
      };

      const { data } = await axios.post<LoginOutput>(
        `${server.apiBaseUrl}/v1/accounts/emails/verify`,
        emailVerifyInput
      );

      if (data.type === 'verify') {
        throw new MutationError(
          MutationErrorCode.EmailVerificationFailed,
          'Email verification failed! Please try again.'
        );
      }

      await this.handleLoginSuccess(data, server);

      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
