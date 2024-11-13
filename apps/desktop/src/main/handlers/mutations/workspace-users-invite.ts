import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/lib/http-client';
import { WorkspaceUsersInviteMutationInput } from '@/operations/mutations/workspace-users-invite';
import { MutationChange, MutationHandler, MutationResult } from '@/main/types';
import { WorkspaceUsersInviteOutput } from '@colanode/core';
import { CreateNode } from '@/main/data/workspace/schema';
import { toUint8Array } from 'js-base64';

export class WorkspaceUsersInviteMutationHandler
  implements MutationHandler<WorkspaceUsersInviteMutationInput>
{
  async handleMutation(
    input: WorkspaceUsersInviteMutationInput
  ): Promise<MutationResult<WorkspaceUsersInviteMutationInput>> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', input.userId)
      .executeTakeFirst();

    if (!workspace) {
      return {
        output: {
          success: false,
        },
      };
    }

    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', workspace.account_id)
      .executeTakeFirst();

    if (!account) {
      return {
        output: {
          success: false,
        },
      };
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      return {
        output: {
          success: false,
        },
      };
    }

    const { data } = await httpClient.post<WorkspaceUsersInviteOutput>(
      `/v1/workspaces/${workspace.workspace_id}/users`,
      {
        emails: input.emails,
      },
      {
        serverDomain: server.domain,
        serverAttributes: server.attributes,
        token: account.token,
      }
    );

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const usersToCreate: CreateNode[] = data.users.map((user) => {
      return {
        id: user.id,
        attributes: JSON.stringify(user.attributes),
        state: toUint8Array(user.state),
        created_at: user.createdAt,
        created_by: user.createdBy,
        updated_at: user.updatedAt,
        updated_by: user.updatedBy,
        server_created_at: user.serverCreatedAt,
        server_updated_at: user.serverUpdatedAt,
        server_version_id: user.versionId,
        version_id: user.versionId,
      };
    });

    await workspaceDatabase
      .insertInto('nodes')
      .values(usersToCreate)
      .onConflict((cb) => cb.doNothing())
      .execute();

    const changedTables: MutationChange[] = [
      {
        type: 'workspace',
        table: 'nodes',
        userId: input.userId,
      },
    ];

    return {
      output: {
        success: true,
      },
      changes: changedTables,
    };
  }
}
