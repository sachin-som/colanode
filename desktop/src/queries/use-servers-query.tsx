import { useAppDatabase } from '@/contexts/app-database';
import { SelectServer } from '@/electron/schemas/app';
import { Server } from '@/types/servers';
import { useQuery } from '@tanstack/react-query';
import { QueryResult } from 'kysely';

export const useServersQuery = () => {
  const appDatabase = useAppDatabase();
  return useQuery<QueryResult<SelectServer>, Error, Server[], string[]>({
    queryKey: ['servers'],
    queryFn: async ({ queryKey }) => {
      const query = appDatabase.database
        .selectFrom('servers')
        .selectAll()
        .compile();

      const servers = await appDatabase.queryAndSubscribe({
        key: ['servers'],
        query: query,
      });

      return servers;
    },
    select: (data: QueryResult<SelectServer>): Server[] => {
      const rows = data?.rows ?? [];
      return rows.map(mapServer);
    },
  });
};

const mapServer = (row: SelectServer): Server => {
  return {
    domain: row.domain,
    name: row.name,
    avatar: row.avatar,
    attributes: JSON.parse(row.attributes),
    version: row.version,
    createdAt: new Date(row.created_at),
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
  };
};
