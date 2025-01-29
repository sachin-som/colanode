import { Outlet } from 'react-router-dom';
import React from 'react';

import { AppContext } from './contexts/app';

import { DelayedComponent } from '@/renderer/components/ui/delayed-component';
import { AppLoader } from '@/renderer/app-loader';
import { useQuery } from '@/renderer/hooks/use-query';
import { RadarProvider } from '@/renderer/radar-provider';

export const App = () => {
  const [initialized, setInitialized] = React.useState(false);

  const { data, isPending } = useQuery({
    type: 'app_metadata_list',
  });

  React.useEffect(() => {
    window.colanode.init().then(() => {
      setInitialized(true);
    });
  }, []);

  if (!initialized || isPending) {
    return (
      <DelayedComponent>
        <AppLoader />
      </DelayedComponent>
    );
  }

  return (
    <AppContext.Provider
      value={{
        getMetadata: (key: string) => {
          return data?.find((metadata) => metadata.key === key)?.value;
        },
      }}
    >
      <RadarProvider>
        <Outlet />
      </RadarProvider>
    </AppContext.Provider>
  );
};
