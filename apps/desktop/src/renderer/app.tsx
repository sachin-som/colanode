import React from 'react';
import { Login } from '@/renderer/components/accounts/login';
import { AppLoading } from '@/renderer/app-loading';
import { AccountContext } from '@/renderer/contexts/account';
import { Outlet } from 'react-router-dom';
import { AccountLogout } from '@/renderer/components/accounts/account-logout';
import { DelayedComponent } from '@/renderer/components/ui/delayed-component';
import { useQuery } from '@/renderer/hooks/use-query';
import { AccountSettingsDialog } from '@/renderer/components/accounts/account-settings-dialog';

export const App = () => {
  const [showLogout, setShowLogout] = React.useState(false);
  const [showAccountSettings, setShowAccountSettings] = React.useState(false);

  const { data: servers, isPending: isPendingServers } = useQuery({
    type: 'server_list',
  });
  const { data: accounts, isPending: isPendingAccounts } = useQuery({
    type: 'account_list',
  });
  const { data: workspaces, isPending: isPendingWorkspaces } = useQuery({
    type: 'workspace_list',
  });

  const isPending =
    isPendingServers || isPendingAccounts || isPendingWorkspaces;

  if (isPending) {
    return (
      <DelayedComponent>
        <AppLoading />
      </DelayedComponent>
    );
  }

  if (!accounts || accounts.length === 0) {
    return <Login />;
  }

  const account = accounts[0];
  const server = servers?.find((server) => server.domain === account?.server);

  if (!server) {
    return <p>Server not found.</p>;
  }

  const accountWorkspaces = workspaces?.filter(
    (workspace) => workspace.accountId === account?.id
  );

  return (
    <AccountContext.Provider
      value={{
        ...account,
        workspaces: accountWorkspaces ?? [],
        logout: () => {
          setShowLogout(true);
        },
        openSettings: () => {
          setShowAccountSettings(true);
        },
      }}
    >
      <Outlet />
      {showLogout && (
        <AccountLogout
          id={account?.id ?? ''}
          onCancel={() => {
            setShowLogout(false);
          }}
          onLogout={() => {
            setShowLogout(false);
          }}
        />
      )}
      {showAccountSettings && (
        <AccountSettingsDialog
          id={account?.id ?? ''}
          open={showAccountSettings}
          onOpenChange={setShowAccountSettings}
        />
      )}
    </AccountContext.Provider>
  );
};
