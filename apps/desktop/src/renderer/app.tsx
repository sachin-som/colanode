import React from 'react';
import { AppLoading } from '@/renderer/app-loading';
import { Outlet, useNavigate } from 'react-router-dom';
import { DelayedComponent } from '@/renderer/components/ui/delayed-component';
import { useQuery } from '@/renderer/hooks/use-query';
import { AppContext } from '@/renderer/contexts/app';
import { AccountProvider } from '@/renderer/components/accounts/account-provider';
import { AccountLogout } from '@/renderer/components/accounts/account-logout';
import { AccountSettingsDialog } from '@/renderer/components/accounts/account-settings-dialog';

export const App = () => {
  const navigate = useNavigate();
  const [logoutId, setLogoutId] = React.useState<string | null>(null);
  const [settingsId, setSettingsId] = React.useState<string | null>(null);

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

  return (
    <AppContext.Provider
      value={{
        accounts: accounts ?? [],
        workspaces: workspaces ?? [],
        servers: servers ?? [],
        showAccountLogin: () => {
          navigate('/login');
        },
        showAccountLogout: (id) => {
          setLogoutId(id);
        },
        showAccountSettings: (id) => {
          setSettingsId(id);
        },
        setAccount: (id) => {
          const account = accounts?.find((a) => a.id === id);
          if (!account) {
            return;
          }

          const accountWorkspaces =
            workspaces?.filter((w) => w.accountId === id) ?? [];

          if (accountWorkspaces.length === 0) {
            return;
          }

          navigate(`/${accountWorkspaces[0].userId}`);
        },
      }}
    >
      <AccountProvider>
        <Outlet />
      </AccountProvider>
      {logoutId && (
        <AccountLogout
          id={logoutId}
          onCancel={() => setLogoutId(null)}
          onLogout={() => {
            setLogoutId(null);
            const activeAccounts =
              accounts?.filter((a) => a.id !== logoutId) ?? [];
            if (activeAccounts.length > 0) {
              const activeWorkspaces =
                workspaces?.filter((w) =>
                  activeAccounts.some((a) => a.id === w.accountId)
                ) ?? [];

              if (activeWorkspaces.length > 0) {
                navigate(`/${activeWorkspaces[0].userId}`);
                return;
              }
            }

            navigate('/login');
          }}
        />
      )}
      {settingsId && (
        <AccountSettingsDialog
          id={settingsId}
          open={true}
          onOpenChange={() => setSettingsId(null)}
        />
      )}
    </AppContext.Provider>
  );
};
