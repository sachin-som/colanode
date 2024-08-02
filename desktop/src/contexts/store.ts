import { createContext, useContext } from 'react';
import { store, AppStore } from '@/store';

export const StoreContext = createContext<AppStore>(store);

export const useStore = () => useContext(StoreContext);
