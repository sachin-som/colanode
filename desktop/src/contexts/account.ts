import { createContext, useContext } from 'react';
import { Account } from '@/types/accounts';

export const AccountContext = createContext<Account>({} as Account);

export const useAccount = () => useContext(AccountContext);
