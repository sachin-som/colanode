import { UserRoleUpdateOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { httpClient } from '@/shared/lib/http-client';
import {
  UserRoleUpdateMutationInput,
  UserRoleUpdateMutationOutput,
} from '@/shared/mutations/workspaces/workspace-user-role-update';
import { MutationError } from '@/shared/mutations';

export class UserRoleUpdateMutationHandler
  implements MutationHandler<UserRoleUpdateMutationInput>
{
  async handleMutation(
    input: UserRoleUpdateMutationInput
  ): Promise<UserRoleUpdateMutationOutput> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', input.userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new MutationError('workspace_not_found', 'Workspace not found');
    }

    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', workspace.account_id)
      .executeTakeFirst();

    if (!account) {
      throw new MutationError(
        'account_not_found',
        'The account associated with this workspace was not found.'
      );
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new MutationError(
        'server_not_found',
        'The server associated with this account was not found.'
      );
    }

    await httpClient.put<UserRoleUpdateOutput>(
      `/v1/workspaces/${workspace.workspace_id}/users/${input.userToUpdateId}`,
      {
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
  }
}
