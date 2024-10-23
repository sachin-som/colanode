import { LoginOutput } from '@/types/accounts';
import { databaseManager } from '@/main/data/database-manager';
import { httpClient } from '@/lib/http-client';
import { EmailRegisterMutationInput } from '@/operations/mutations/email-register';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';

export class EmailRegisterMutationHandler
  implements MutationHandler<EmailRegisterMutationInput>
{
  handleMutation = async (
    input: EmailRegisterMutationInput,
  ): Promise<MutationResult<EmailRegisterMutationInput>> => {
    const server = await databaseManager.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', input.server)
      .executeTakeFirst();

    if (!server) {
      return {
        output: {
          success: false,
        },
      };
    }

    const { data } = await httpClient.post<LoginOutput>(
      '/v1/accounts/register/email',
      {
        name: input.name,
        email: input.email,
        password: input.password,
      },
      {
        serverDomain: server.domain,
        serverAttributes: server.attributes,
      },
    );

    const changedTables: MutationChange[] = [];
    await databaseManager.appDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('accounts')
        .values({
          id: data.account.id,
          name: data.account.name,
          avatar: data.account.avatar,
          device_id: data.account.deviceId,
          email: data.account.email,
          token: data.account.token,
          server: server.domain,
        })
        .execute();

      changedTables.push({
        type: 'app',
        table: 'accounts',
      });

      if (data.workspaces.length === 0) {
        return;
      }

      await trx
        .insertInto('workspaces')
        .values(
          data.workspaces.map((workspace) => ({
            workspace_id: workspace.id,
            name: workspace.name,
            account_id: data.account.id,
            avatar: workspace.avatar,
            role: workspace.user.role,
            description: workspace.description,
            user_id: workspace.user.id,
            version_id: workspace.versionId,
          })),
        )
        .execute();

      changedTables.push({
        type: 'app',
        table: 'workspaces',
      });
    });

    for (const workspace of data.workspaces) {
      const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
        workspace.user.id,
      );

      const user = workspace.user.node;
      await workspaceDatabase
        .insertInto('nodes')
        .values({
          id: user.id,
          attributes: JSON.stringify(user.attributes),
          state: user.state,
          created_at: user.createdAt,
          created_by: user.createdBy,
          updated_at: user.updatedAt,
          updated_by: user.updatedBy,
          server_created_at: user.serverCreatedAt,
          server_updated_at: user.serverUpdatedAt,
          version_id: user.versionId,
          server_version_id: user.versionId,
        })
        .onConflict((cb) => cb.doNothing())
        .execute();

      changedTables.push({
        type: 'workspace',
        table: 'nodes',
        userId: workspace.user.id,
      });
    }

    return {
      output: {
        success: true,
      },
      changes: changedTables,
    };
  };
}
