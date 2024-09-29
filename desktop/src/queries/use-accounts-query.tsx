import { useAppDatabase } from '@/contexts/app-database';
import { SelectAccount, SelectServer } from '@/electron/schemas/app';
import { Account } from '@/types/accounts';
import { useQuery } from '@tanstack/react-query';
import { QueryResult } from 'kysely';

export const useAccountsQuery = () => {
  const appDatabase = useAppDatabase();
  return useQuery<QueryResult<SelectAccount>, Error, Account[], string[]>({
    queryKey: ['accounts'],
    queryFn: async ({ queryKey }) => {
      const query = appDatabase.database
        .selectFrom('accounts')
        .selectAll()
        .where('status', '=', 'active')
        .compile();

      return await window.neuron.executeAppQueryAndSubscribe({
        key: queryKey,
        query: query,
      });
    },
    select: (data: QueryResult<SelectAccount>): Account[] => {
      const rows = data?.rows ?? [];
      return rows.map(mapAccount);
    },
  });
};

const mapAccount = (row: SelectAccount): Account => {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    token: row.token,
    email: row.email,
    deviceId: row.device_id,
    status: row.status,
    server: row.server,
  };
};
