import axios from 'axios';
import { databaseContext } from '@/main/database-context';
import { buildApiBaseUrl, mapServer } from '@/lib/servers';
import { WorkspaceAccountsInviteMutationInput } from '@/types/mutations/workspace-accounts-invite';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';
import { WorkspaceAccountsInviteOutput } from '@/types/workspaces';
import { CreateNode } from '@/main/schemas/workspace';

export class WorkspaceAccountsInviteMutationHandler
  implements MutationHandler<WorkspaceAccountsInviteMutationInput>
{
  async handleMutation(
    input: WorkspaceAccountsInviteMutationInput,
  ): Promise<MutationResult<WorkspaceAccountsInviteMutationInput>> {
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
    const { data } = await axios.post<WorkspaceAccountsInviteOutput>(
      `${buildApiBaseUrl(server)}/v1/workspaces/${workspaceRow.workspace_id}/accounts`,
      {
        emails: input.emails,
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

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const usersToCreate: CreateNode[] = data.users.map((user) => {
      return {
        id: user.id,
        attributes: JSON.stringify(user.attributes),
        state: user.state,
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
      changedTables: changedTables,
    };
  }
}
