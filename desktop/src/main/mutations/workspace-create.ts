import axios from 'axios';
import { databaseContext } from '@/main/data/database-context';
import { buildApiBaseUrl, mapServer } from '@/lib/servers';
import { WorkspaceCreateMutationInput } from '@/types/mutations/workspace-create';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/types/mutations';
import { Workspace } from '@/types/workspaces';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
  async handleMutation(
    input: WorkspaceCreateMutationInput,
  ): Promise<MutationResult<WorkspaceCreateMutationInput>> {
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
      `${buildApiBaseUrl(server)}/v1/workspaces`,
      {
        name: input.name,
        description: input.description,
      },
      {
        headers: {
          Authorization: `Bearer ${accountRow.token}`,
        },
      },
    );

    await databaseContext.appDatabase
      .insertInto('workspaces')
      .values({
        workspace_id: data.id ?? data.id,
        account_id: data.accountId,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        role: data.role,
        synced: 0,
        user_id: data.userId,
        version_id: data.versionId,
      })
      .onConflict((cb) => cb.doNothing())
      .execute();

    const changedTables: MutationChange[] = [
      {
        type: 'app',
        table: 'workspaces',
      },
    ];

    return {
      output: {
        id: data.id,
      },
      changedTables: changedTables,
    };
  }
}
