import { createContext, useContext } from 'react';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { Server } from '@/types/servers';

interface AppContext {
  accounts: Account[];
  workspaces: Workspace[];
  servers: Server[];
  showAccountLogin: () => void;
  setAccount: (id: string) => void;
  showAccountLogout: (id: string) => void;
  showAccountSettings: (id: string) => void;
}

export const AppContext = createContext<AppContext>({} as AppContext);

export const useApp = () => useContext(AppContext);
