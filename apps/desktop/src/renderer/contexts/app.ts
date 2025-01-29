import { createContext, useContext } from 'react';

import { AppMetadataKey, AppMetadataMap } from '@/shared/types/apps';

interface AppContext {
  getMetadata: <K extends AppMetadataKey>(
    key: K
  ) => AppMetadataMap[K]['value'] | undefined;
}

export const AppContext = createContext<AppContext>({} as AppContext);

export const useApp = () => useContext(AppContext);
