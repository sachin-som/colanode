import { ViewFilterNode } from '@/types/databases';
import { createContext, useContext } from 'react';

interface ViewContext {
  id: string;
  filters: ViewFilterNode[];
  addFilter: (filter: ViewFilterNode) => void;
  removeFilter: (id: string) => void;
  updateFilter: (id: string, filter: ViewFilterNode) => void;
}

export const ViewContext = createContext<ViewContext>({} as ViewContext);

export const useView = () => useContext(ViewContext);
