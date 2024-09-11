import { FieldNode, ViewNode } from '@/types/databases';
import { createContext, useContext } from 'react';

interface DatabaseContext {
  id: string;
  name: string;
  fields: FieldNode[];
  views: ViewNode[];
  activeViewId: string;
  setActiveViewId: (viewId: string) => void;
}

export const DatabaseContext = createContext<DatabaseContext>(
  {} as DatabaseContext,
);

export const useDatabase = () => useContext(DatabaseContext);
