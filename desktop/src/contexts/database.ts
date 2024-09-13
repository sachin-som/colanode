import { FieldNode } from '@/types/databases';
import { createContext, useContext } from 'react';

interface DatabaseContext {
  id: string;
  name: string;
  fields: FieldNode[];
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext,
);

export const useDatabase = () => useContext(DatabaseContext);
