import { createContext, useContext } from 'react';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';

interface AccountContext extends Account {
  workspaces: Workspace[];
  logout: () => void;
  openSettings: () => void;
}

export const AccountContext = createContext<AccountContext>(
  {} as AccountContext
);

export const useAccount = () => useContext(AccountContext);
