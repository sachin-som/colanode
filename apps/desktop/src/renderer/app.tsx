import React from 'react';
import { AppLoading } from '@/renderer/app-loading';
import { Outlet, useNavigate } from 'react-router-dom';
import { DelayedComponent } from '@/renderer/components/ui/delayed-component';
import { useQuery } from '@/renderer/hooks/use-query';
import { AppContext } from '@/renderer/contexts/app';
import { AccountLogout } from '@/renderer/components/accounts/account-logout';
import { AccountSettingsDialog } from '@/renderer/components/accounts/account-settings-dialog';
import { RadarProvider } from '@/renderer/radar-provider';
import { WorkspaceSettingsDialog } from '@/renderer/components/workspaces/workspace-settings-dialog';

export const App = () => {
  const navigate = useNavigate();
  const [logoutId, setLogoutId] = React.useState<string | null>(null);
  const [accountSettingsId, setSettingsId] = React.useState<string | null>(
    null
  );
  const [workspaceSettingsId, setWorkspaceSettingsId] = React.useState<
    string | null
  >(null);

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

          navigate(`/${id}`);
        },
        showWorkspaceSettings: (id) => {
          setWorkspaceSettingsId(id);
        },
      }}
    >
      <RadarProvider>
        <Outlet />
      </RadarProvider>
      {logoutId && (
        <AccountLogout
          id={logoutId}
          onCancel={() => setLogoutId(null)}
          onLogout={() => {
            setLogoutId(null);
            const activeAccounts =
              accounts?.filter((a) => a.id !== logoutId) ?? [];
            if (activeAccounts.length > 0) {
              navigate(`/${activeAccounts[0].id}`);
            }

            navigate('/login');
          }}
        />
      )}
      {accountSettingsId && (
        <AccountSettingsDialog
          id={accountSettingsId}
          open={true}
          onOpenChange={() => setSettingsId(null)}
        />
      )}
      {workspaceSettingsId && (
        <WorkspaceSettingsDialog
          id={workspaceSettingsId}
          open={true}
          onOpenChange={() => setWorkspaceSettingsId(null)}
        />
      )}
    </AppContext.Provider>
  );
};
