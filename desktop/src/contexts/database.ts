import { LocalNode } from '@/types/nodes';
import { createContext, useContext } from 'react';

interface DatabaseContext {
  id: string;
  fields: LocalNode[];
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext,
);

export const useDatabase = () => useContext(DatabaseContext);
