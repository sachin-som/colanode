import { UsersInviteOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { httpClient } from '@/shared/lib/http-client';
import {
  UsersInviteMutationInput,
  UsersInviteMutationOutput,
} from '@/shared/mutations/workspaces/workspace-users-invite';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';

export class UsersInviteMutationHandler
  implements MutationHandler<UsersInviteMutationInput>
{
  async handleMutation(
    input: UsersInviteMutationInput
  ): Promise<UsersInviteMutationOutput> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', input.userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotFound,
        'Workspace was not found or has been deleted.'
      );
    }

    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', workspace.account_id)
      .executeTakeFirst();

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'The account associated with this workspace was not found or has been logged out.'
      );
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new MutationError(
        MutationErrorCode.ServerNotFound,
        'The server associated with this account was not found.'
      );
    }

    try {
      await httpClient.post<UsersInviteOutput>(
        `/v1/workspaces/${workspace.workspace_id}/users`,
        {
          emails: input.emails,
          role: input.role,
        },
        {
          domain: server.domain,
          token: account.token,
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
