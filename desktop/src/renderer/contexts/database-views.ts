import { ViewAttributes } from '@/registry';
import { createContext, useContext } from 'react';

interface DatabaseViewsContext {
  views: ViewAttributes[];
  activeViewId: string;
  setActiveViewId: (viewId: string) => void;
}

export const DatabaseViewsContext = createContext<DatabaseViewsContext>(
  {} as DatabaseViewsContext,
);

export const useDatabaseViews = () => useContext(DatabaseViewsContext);
