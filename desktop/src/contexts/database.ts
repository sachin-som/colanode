import { Field } from '@/types/databases';
import { createContext, useContext } from 'react';

interface DatabaseContext {
  id: string;
  fields: Field[];
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext,
);

export const useDatabase = () => useContext(DatabaseContext);
