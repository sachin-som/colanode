import { createContext, useContext } from 'react';
import { Account } from '@/shared/types/accounts';
import { Workspace } from '@/shared/types/workspaces';
import { Server } from '@/shared/types/servers';

interface AppContext {
  accounts: Account[];
  workspaces: Workspace[];
  servers: Server[];
}

export const AppContext = createContext<AppContext>({} as AppContext);

export const useApp = () => useContext(AppContext);
