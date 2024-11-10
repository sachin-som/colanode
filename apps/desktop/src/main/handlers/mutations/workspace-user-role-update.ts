import { databaseManager } from '@/main/data/database-manager';
import { httpClient } from '@/lib/http-client';
import { WorkspaceUserRoleUpdateMutationInput } from '@/operations/mutations/workspace-user-role-update';
import { MutationChange, MutationHandler, MutationResult } from '@/main/types';
import { WorkspaceUserRoleUpdateOutput } from '@/types/workspaces';
import { toUint8Array } from 'js-base64';

export class WorkspaceUserRoleUpdateMutationHandler
  implements MutationHandler<WorkspaceUserRoleUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceUserRoleUpdateMutationInput
  ): Promise<MutationResult<WorkspaceUserRoleUpdateMutationInput>> {
    const workspace = await databaseManager.appDatabase
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

    const account = await databaseManager.appDatabase
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

    const server = await databaseManager.appDatabase
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

    const { data } = await httpClient.put<WorkspaceUserRoleUpdateOutput>(
      `/v1/workspaces/${workspace.workspace_id}/users/${input.userToUpdateId}`,
      {
        role: input.role,
      },
      {
        serverDomain: server.domain,
        serverAttributes: server.attributes,
        token: account.token,
      }
    );

    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        attributes: JSON.stringify(data.user.attributes),
        state: toUint8Array(data.user.state),
        updated_at: data.user.updatedAt,
        updated_by: data.user.updatedBy,
        version_id: data.user.versionId,
        server_updated_at: data.user.updatedAt,
        server_version_id: data.user.versionId,
      })
      .where('id', '=', data.user.id)
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
