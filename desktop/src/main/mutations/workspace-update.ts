import { databaseContext } from '@/main/data/database-context';
import { buildAxiosInstance } from '@/lib/servers';
import { WorkspaceUpdateMutationInput } from '@/types/mutations/workspace-update';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';
import { Workspace } from '@/types/workspaces';

export class WorkspaceUpdateMutationHandler
  implements MutationHandler<WorkspaceUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceUpdateMutationInput,
  ): Promise<MutationResult<WorkspaceUpdateMutationInput>> {
    const account = await databaseContext.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      throw new Error('Account not found!');
    }

    const server = await databaseContext.appDatabase
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
    const { data } = await axios.post<Workspace>(`/v1/workspaces/${input.id}`, {
      name: input.name,
      description: input.description,
    });

    await databaseContext.appDatabase
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
