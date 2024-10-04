import axios from 'axios';
import { databaseContext } from '@/main/data/database-context';
import { buildApiBaseUrl, mapServer } from '@/lib/servers';
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
    const accountRow = await databaseContext.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!accountRow) {
      throw new Error('Account not found!');
    }

    const serverRow = await databaseContext.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', accountRow.server)
      .executeTakeFirst();

    if (!serverRow) {
      throw new Error('Account not found');
    }

    const server = mapServer(serverRow);
    const { data } = await axios.post<Workspace>(
      `${buildApiBaseUrl(server)}/v1/workspaces/${input.id}`,
      {
        name: input.name,
        description: input.description,
      },
    );

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
