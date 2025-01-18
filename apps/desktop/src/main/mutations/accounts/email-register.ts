import { EmailRegisterInput, LoginOutput } from '@colanode/core';
import axios from 'axios';

import { MutationHandler } from '@/main/lib/types';
import { EmailRegisterMutationInput } from '@/shared/mutations/accounts/email-register';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { appService } from '@/main/services/app-service';
import { AccountMutationHandlerBase } from '@/main/mutations/accounts/base';

export class EmailRegisterMutationHandler
  extends AccountMutationHandlerBase
  implements MutationHandler<EmailRegisterMutationInput>
{
  async handleMutation(
    input: EmailRegisterMutationInput
  ): Promise<LoginOutput> {
    const server = appService.getServer(input.server);

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
        version: appService.version,
      };

      const { data } = await axios.post<LoginOutput>(
        `${server.apiBaseUrl}/v1/accounts/emails/register`,
        emailRegisterInput
      );

      if (data.type === 'verify') {
        return data;
      }

      await this.handleLoginSuccess(data, server);

      return data;
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
