import { createContext, useContext } from 'react';
import { Account } from '@/shared/types/accounts';
import { Workspace } from '@/shared/types/workspaces';
import { Server } from '@/shared/types/servers';

interface AppContext {
  accounts: Account[];
  workspaces: Workspace[];
  servers: Server[];
  showAccountLogin: () => void;
  setAccount: (id: string) => void;
  showAccountLogout: (id: string) => void;
  showAccountSettings: (id: string) => void;
  showWorkspaceSettings: (id: string) => void;
}

export const AppContext = createContext<AppContext>({} as AppContext);

export const useApp = () => useContext(AppContext);
