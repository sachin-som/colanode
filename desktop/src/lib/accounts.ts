import { AppDatabaseSchema } from '@/main/schemas/app';
import { LoginOutput } from '@/types/accounts';
import { Server } from '@/types/servers';
import { CompiledQuery, Kysely } from 'kysely';

export const buildLoginMutationQueries = (
  database: Kysely<AppDatabaseSchema>,
  output: LoginOutput,
  server: Server,
): CompiledQuery[] => {
  const insertAccountQuery = database
    .insertInto('accounts')
    .values({
      id: output.account.id,
      name: output.account.name,
      avatar: output.account.avatar,
      device_id: output.account.deviceId,
      email: output.account.email,
      token: output.account.token,
      server: server.domain,
    })
    .compile();

  const queries: CompiledQuery[] = [insertAccountQuery];

  if (output.workspaces.length > 0) {
    const insertWorkspacesQuery = database
      .insertInto('workspaces')
      .values(
        output.workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          account_id: output.account.id,
          avatar: workspace.avatar,
          role: workspace.role,
          description: workspace.description,
          synced: 0,
          user_id: workspace.userId,
          version_id: workspace.versionId,
        })),
      )
      .compile();

    queries.push(insertWorkspacesQuery);
  }

  return queries;
};
