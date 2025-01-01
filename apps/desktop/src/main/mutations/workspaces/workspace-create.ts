import { WorkspaceOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import {
  WorkspaceCreateMutationInput,
  WorkspaceCreateMutationOutput,
} from '@/shared/mutations/workspaces/workspace-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
  async handleMutation(
    input: WorkspaceCreateMutationInput
  ): Promise<WorkspaceCreateMutationOutput> {
    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out.'
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
      const { data } = await httpClient.post<WorkspaceOutput>(
        `/v1/workspaces`,
        {
          name: input.name,
          description: input.description,
          avatar: input.avatar,
        },
        {
          domain: server.domain,
          token: account.token,
        }
      );

      const createdWorkspace = await databaseService.appDatabase
        .insertInto('workspaces')
        .returningAll()
        .values({
          workspace_id: data.id ?? data.id,
          account_id: data.user.accountId,
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          role: data.user.role,
          user_id: data.user.id,
        })
        .onConflict((cb) => cb.doNothing())
        .executeTakeFirst();

      if (!createdWorkspace) {
        throw new MutationError(
          MutationErrorCode.WorkspaceNotCreated,
          'Something went wrong updating the workspace. Please try again later.'
        );
      }

      eventBus.publish({
        type: 'workspace_created',
        workspace: {
          id: createdWorkspace.workspace_id,
          userId: createdWorkspace.user_id,
          name: createdWorkspace.name,
          accountId: createdWorkspace.account_id,
          role: createdWorkspace.role,
          avatar: createdWorkspace.avatar,
          description: createdWorkspace.description,
        },
      });

      return {
        id: createdWorkspace.workspace_id,
        userId: createdWorkspace.user_id,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
