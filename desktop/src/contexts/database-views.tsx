import { ViewNode } from '@/types/databases';
import { createContext, useContext } from 'react';

interface DatabaseViewsContext {
  views: ViewNode[];
  activeViewId: string;
  setActiveViewId: (viewId: string) => void;
}

export const DatabaseViewsContext = createContext<DatabaseViewsContext>(
  {} as DatabaseViewsContext,
);

export const useDatabaseViews = () => useContext(DatabaseViewsContext);
