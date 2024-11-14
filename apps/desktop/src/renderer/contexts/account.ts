import { createContext, useContext } from 'react';
import { Account } from '@/shared/types/accounts';
import { Workspace } from '@/shared/types/workspaces';

interface AccountContext extends Account {
  workspaces: Workspace[];
  openSettings: () => void;
  openLogout: () => void;
}

export const AccountContext = createContext<AccountContext>(
  {} as AccountContext
);

export const useAccount = () => useContext(AccountContext);
