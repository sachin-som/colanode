import { AppLoading } from '@/renderer/app-loading';
import { Outlet } from 'react-router-dom';
import { DelayedComponent } from '@/renderer/components/ui/delayed-component';
import { useQuery } from '@/renderer/hooks/use-query';
import { AppContext } from '@/renderer/contexts/app';
import { RadarProvider } from '@/renderer/radar-provider';

export const App = () => {
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
      }}
    >
      <RadarProvider>
        <Outlet />
      </RadarProvider>
    </AppContext.Provider>
  );
};
