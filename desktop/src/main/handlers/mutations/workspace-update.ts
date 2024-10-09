import { databaseManager } from '@/main/data/database-manager';
import { buildAxiosInstance } from '@/lib/servers';
import { WorkspaceUpdateMutationInput } from '@/operations/mutations/workspace-update';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { Workspace } from '@/types/workspaces';

export class WorkspaceUpdateMutationHandler
  implements MutationHandler<WorkspaceUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceUpdateMutationInput,
  ): Promise<MutationResult<WorkspaceUpdateMutationInput>> {
    const account = await databaseManager.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      throw new Error('Account not found!');
    }

    const server = await databaseManager.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Account not found');
    }

    const axios = buildAxiosInstance(
      server.domain,
      server.attributes,
      account.token,
    );

    const { data } = await axios.put<Workspace>(`/v1/workspaces/${input.id}`, {
      name: input.name,
      description: input.description,
      avatar: input.avatar,
    });

    await databaseManager.appDatabase
      .updateTable('workspaces')
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
        ]),
      )
      .execute();

    const changedTables: MutationChange[] = [
      {
        type: 'app',
        table: 'workspaces',
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
