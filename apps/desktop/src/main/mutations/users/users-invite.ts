import { UsersInviteOutput } from '@colanode/core';

import { MutationHandler } from '@/main/types';
import {
  UsersInviteMutationInput,
  UsersInviteMutationOutput,
} from '@/shared/mutations/workspaces/workspace-users-invite';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class UsersInviteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<UsersInviteMutationInput>
{
  async handleMutation(
    input: UsersInviteMutationInput
  ): Promise<UsersInviteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    try {
      await workspace.account.client.post<UsersInviteOutput>(
        `/v1/workspaces/${workspace.id}/users`,
        {
          emails: input.emails,
          role: input.role,
        }
      );

      return {
        success: true,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
