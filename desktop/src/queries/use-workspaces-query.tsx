import { useAppDatabase } from '@/contexts/app-database';
import { SelectWorkspace } from '@/electron/schemas/app';
import { Workspace, WorkspaceRole } from '@/types/workspaces';
import { useQuery } from '@tanstack/react-query';
import { QueryResult } from 'kysely';

export const useWorkspacesQuery = () => {
  const appDatabase = useAppDatabase();
  return useQuery<QueryResult<SelectWorkspace>, Error, Workspace[], string[]>({
    queryKey: ['workspaces'],
    queryFn: async ({ queryKey }) => {
      const query = appDatabase.database
        .selectFrom('workspaces')
        .selectAll()
        .where(
          'account_id',
          'in',
          appDatabase.database
            .selectFrom('accounts')
            .where('status', '=', 'active')
            .select('id'),
        )

        .compile();

      return await window.neuron.executeAppQueryAndSubscribe({
        key: queryKey,
        query: query,
      });
    },
    select: (data: QueryResult<SelectWorkspace>): Workspace[] => {
      const rows = data?.rows ?? [];
      return rows.map(mapWorkspaces);
    },
  });
};

const mapWorkspaces = (row: SelectWorkspace): Workspace => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    avatar: row.avatar,
    versionId: row.version_id,
    accountId: row.account_id,
    role: row.role as WorkspaceRole,
    userId: row.user_id,
    synced: row.synced === 1,
  };
};
