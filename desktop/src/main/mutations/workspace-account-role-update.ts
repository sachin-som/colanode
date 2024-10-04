import axios from 'axios';
import { databaseContext } from '@/main/data/database-context';
import { buildApiBaseUrl } from '@/lib/servers';
import { WorkspaceAccountRoleUpdateMutationInput } from '@/types/mutations/workspace-account-role-update';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';
import { WorkspaceAccountRoleUpdateOutput } from '@/types/workspaces';

export class WorkspaceAccountRoleUpdateMutationHandler
  implements MutationHandler<WorkspaceAccountRoleUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceAccountRoleUpdateMutationInput,
  ): Promise<MutationResult<WorkspaceAccountRoleUpdateMutationInput>> {
    const workspace = await databaseContext.appDatabase
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

    const account = await databaseContext.appDatabase
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

    const server = await databaseContext.appDatabase
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

    const { data } = await axios.post<WorkspaceAccountRoleUpdateOutput>(
      `${buildApiBaseUrl(server)}/v1/workspaces/${workspace.workspace_id}/accounts/${input.accountId}`,
      {
        role: input.role,
      },
      {
        headers: {
          Authorization: `Bearer ${account.token}`,
        },
      },
    );

    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        attributes: JSON.stringify(data.user.attributes),
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
