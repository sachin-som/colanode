import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/lib/http-client';
import { WorkspaceUpdateMutationInput } from '@/operations/mutations/workspace-update';
import { MutationHandler, MutationResult } from '@/main/types';
import { Workspace } from '@/types/workspaces';

export class WorkspaceUpdateMutationHandler
  implements MutationHandler<WorkspaceUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceUpdateMutationInput
  ): Promise<MutationResult<WorkspaceUpdateMutationInput>> {
    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      throw new Error('Account not found!');
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Account not found');
    }

    const { data } = await httpClient.put<Workspace>(
      `/v1/workspaces/${input.id}`,
      {
        name: input.name,
        description: input.description,
        avatar: input.avatar,
      },
      {
        serverDomain: server.domain,
        serverAttributes: server.attributes,
        token: account.token,
      }
    );

    await databaseService.appDatabase
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
        ])
      )
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'app',
          table: 'workspaces',
        },
      ],
    };
  }
}
