import axios from 'axios';
import { databaseContext } from '@/main/data/database-context';
import { buildApiBaseUrl, mapServer } from '@/lib/servers';
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
    const workspaceRow = await databaseContext.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', input.userId)
      .executeTakeFirst();

    if (!workspaceRow) {
      return {
        output: {
          success: false,
        },
      };
    }

    const accountRow = await databaseContext.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', workspaceRow.account_id)
      .executeTakeFirst();

    if (!accountRow) {
      return {
        output: {
          success: false,
        },
      };
    }

    const serverRow = await databaseContext.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', accountRow.server)
      .executeTakeFirst();

    if (!serverRow) {
      return {
        output: {
          success: false,
        },
      };
    }

    const server = mapServer(serverRow);
    const { data } = await axios.post<WorkspaceAccountRoleUpdateOutput>(
      `${buildApiBaseUrl(server)}/v1/workspaces/${workspaceRow.workspace_id}/accounts/${input.accountId}`,
      {
        role: input.role,
      },
      {
        headers: {
          Authorization: `Bearer ${accountRow.token}`,
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
