import { databaseManager } from '@/main/data/database-manager';
import { buildAxiosInstance } from '@/lib/servers';
import { WorkspaceAccountsInviteMutationInput } from '@/types/mutations/workspace-accounts-invite';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';
import { WorkspaceAccountsInviteOutput } from '@/types/workspaces';
import { CreateNode } from '@/main/data/workspace/schema';

export class WorkspaceAccountsInviteMutationHandler
  implements MutationHandler<WorkspaceAccountsInviteMutationInput>
{
  async handleMutation(
    input: WorkspaceAccountsInviteMutationInput,
  ): Promise<MutationResult<WorkspaceAccountsInviteMutationInput>> {
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

    const axios = buildAxiosInstance(
      server.domain,
      server.attributes,
      account.token,
    );
    const { data } = await axios.post<WorkspaceAccountsInviteOutput>(
      `/v1/workspaces/${workspace.workspace_id}/users`,
      {
        emails: input.emails,
      },
    );

    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

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
      changes: changedTables,
    };
  }
}
