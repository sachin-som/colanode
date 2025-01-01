import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { parseApiError } from '@/shared/lib/axios';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  WorkspaceUpdateMutationInput,
  WorkspaceUpdateMutationOutput,
} from '@/shared/mutations/workspaces/workspace-update';
import { Workspace } from '@/shared/types/workspaces';

export class WorkspaceUpdateMutationHandler
  implements MutationHandler<WorkspaceUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceUpdateMutationInput
  ): Promise<WorkspaceUpdateMutationOutput> {
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
      const { data } = await httpClient.put<Workspace>(
        `/v1/workspaces/${input.id}`,
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

      const updatedWorkspace = await databaseService.appDatabase
        .updateTable('workspaces')
        .returningAll()
        .set({
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          role: data.role,
          version_id: data.versionId,
        })
        .where((eb) =>
          eb.and([
            eb('account_id', '=', input.accountId),
            eb('workspace_id', '=', input.id),
          ])
        )
        .executeTakeFirst();

      if (!updatedWorkspace) {
        throw new MutationError(
          MutationErrorCode.WorkspaceNotUpdated,
          'Something went wrong updating the workspace. Please try again later.'
        );
      }

      eventBus.publish({
        type: 'workspace_updated',
        workspace: {
          id: updatedWorkspace.workspace_id,
          userId: updatedWorkspace.user_id,
          name: updatedWorkspace.name,
          versionId: updatedWorkspace.version_id,
          accountId: updatedWorkspace.account_id,
          role: updatedWorkspace.role,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
