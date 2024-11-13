import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/lib/http-client';
import { WorkspaceCreateMutationInput } from '@/operations/mutations/workspace-create';
import { MutationHandler, MutationResult } from '@/main/types';
import { WorkspaceOutput } from '@colanode/core';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
  async handleMutation(
    input: WorkspaceCreateMutationInput
  ): Promise<MutationResult<WorkspaceCreateMutationInput>> {
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

    const { data } = await httpClient.post<WorkspaceOutput>(
      `/v1/workspaces`,
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
      .insertInto('workspaces')
      .values({
        workspace_id: data.id ?? data.id,
        account_id: data.user.accountId,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        role: data.user.role,
        user_id: data.user.id,
        version_id: data.versionId,
      })
      .onConflict((cb) => cb.doNothing())
      .execute();

    return {
      output: {
        id: data.id,
        userId: data.user.id,
      },
      changes: [
        {
          type: 'app',
          table: 'workspaces',
        },
        {
          type: 'workspace',
          table: 'nodes',
          userId: data.user.id,
        },
      ],
    };
  }
}
