import React from 'react';
import { Login } from '@/components/accounts/login';
import { AppLoading } from '@/components/app-loading';
import { AccountContext } from '@/contexts/account';
import Axios from 'axios';
import { AxiosContext } from '@/contexts/axios';
import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';
import { AccountLogout } from '@/components/accounts/account-logout';
import { AppDatabaseContext } from '@/contexts/app-database';
import {
  Kysely,
  SqliteAdapter,
  DummyDriver,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely';
import { AppDatabaseSchema } from '@/data/schemas/app';
import { useQuery } from '@tanstack/react-query';

const serverUrl = 'http://localhost:3000';

const appDatabase = new Kysely<AppDatabaseSchema>({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});

export const App = observer(() => {
  const [showLogout, setShowLogout] = React.useState(false);

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const query = appDatabase.selectFrom('accounts').selectAll().compile();
      return await window.neuron.executeAppQuery(query);
    },
  });

  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const query = appDatabase.selectFrom('workspaces').selectAll().compile();
      return await window.neuron.executeAppQuery(query);
    },
  });

  const isLoading = accountsQuery.isPending || workspacesQuery.isPending;
  if (isLoading) {
    return <AppLoading />;
  }

  if (accountsQuery.data.rows.length == 0) {
    return (
      <AppDatabaseContext.Provider
        value={{
          database: appDatabase,
          executeQuery: (query) => window.neuron.executeAppQuery(query),
        }}
      >
        <Login />
      </AppDatabaseContext.Provider>
    );
  }

  const account = accountsQuery.data.rows[0];
  const axios = Axios.create({
    baseURL: serverUrl,
    headers: {
      Authorization: `Bearer ${account.token}`,
    },
  });

  return (
    <AppDatabaseContext.Provider
      value={{
        database: appDatabase,
        executeQuery: (query) => window.neuron.executeAppQuery(query),
      }}
    >
      <AccountContext.Provider
        value={{
          id: account.id,
          name: account.name,
          avatar: account.avatar,
          token: account.token,
          email: account.email,
          deviceId: account.device_id,
          workspaces: workspacesQuery.data?.rows.map((row) => {
            return {
              id: row.id,
              name: row.name,
              description: row.description,
              avatar: row.avatar,
              versionId: row.version_id,
              accountId: row.account_id,
              role: row.role,
              userId: row.user_id,
              syncedAt: row.synced_at,
            };
          }),
          logout: () => {
            setShowLogout(true);
          },
        }}
      >
        <AxiosContext.Provider value={axios}>
          <Outlet />
        </AxiosContext.Provider>
        {showLogout && (
          <AccountLogout
            id={account.id}
            onCancel={() => {
              setShowLogout(false);
            }}
          />
        )}
      </AccountContext.Provider>
    </AppDatabaseContext.Provider>
  );
});
