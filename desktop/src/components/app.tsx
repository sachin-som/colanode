import React from 'react';
import Axios from 'axios';
import { Login } from '@/components/accounts/login';
import { AppLoading } from '@/components/app-loading';
import { AccountContext } from '@/contexts/account';
import { AxiosContext } from '@/contexts/axios';
import { Outlet } from 'react-router-dom';
import { AccountLogout } from '@/components/accounts/account-logout';
import { DelayedComponent } from '@/components/ui/delayed-component';
import { useAccountsQuery } from '@/queries/use-accounts-query';
import { useWorkspacesQuery } from '@/queries/use-workspaces-query';
import { useServersQuery } from '@/queries/use-servers-query';
import { buildApiBaseUrl } from '@/lib/servers';

export const App = () => {
  const [showLogout, setShowLogout] = React.useState(false);

  const { data: servers, isPending: isPendingServers } = useServersQuery();
  const { data: accounts, isPending: isPendingAccounts } = useAccountsQuery();
  const { data: workspaces, isPending: isPendingWorkspaces } =
    useWorkspacesQuery();

  const isPending =
    isPendingServers || isPendingAccounts || isPendingWorkspaces;

  if (isPending) {
    return (
      <DelayedComponent>
        <AppLoading />
      </DelayedComponent>
    );
  }

  if (accounts.length == 0) {
    return <Login />;
  }

  const account = accounts[0];
  const server = servers.find((server) => server.domain === account.server);

  if (!server) {
    return <p>Server not found.</p>;
  }

  const accountWorkspaces = workspaces.filter(
    (workspace) => workspace.accountId === account.id,
  );

  const axios = Axios.create({
    baseURL: buildApiBaseUrl(server),
    headers: {
      Authorization: `Bearer ${account.token}`,
    },
  });

  return (
    <AccountContext.Provider
      value={{
        ...account,
        workspaces: accountWorkspaces,
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
  );
};
