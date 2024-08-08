import { createContext, useContext } from 'react';
import { Account } from '@/types/accounts';

interface AccountContext extends Account {
  logout: () => void;
}

export const AccountContext = createContext<AccountContext>(
  {} as AccountContext,
);

export const useAccount = () => useContext(AccountContext);
