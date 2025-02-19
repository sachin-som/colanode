import { createContext, useContext } from 'react';

import { LocalDatabaseViewNode } from '@/shared/types/nodes';

interface DatabaseViewsContext {
  views: LocalDatabaseViewNode[];
  activeViewId: string;
  setActiveViewId: (viewId: string) => void;
}

export const DatabaseViewsContext = createContext<DatabaseViewsContext>(
  {} as DatabaseViewsContext
);

export const useDatabaseViews = () => useContext(DatabaseViewsContext);
