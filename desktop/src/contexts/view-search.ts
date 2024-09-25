import { ViewFilter, ViewSort } from '@/types/databases';
import { createContext, useContext } from 'react';

interface ViewSearchContext {
  id: string;
  filters: ViewFilter[];
  sorts: ViewSort[];
  isSaving: boolean;
  isSearchBarOpened: boolean;
  isSortsOpened: boolean;
  isFieldFilterOpened: (fieldId: string) => boolean;
  initFieldFilter: (fieldId: string) => void;
  updateFilter: (id: string, filter: ViewFilter) => void;
  removeFilter: (id: string) => void;
  initFieldSort: (fieldId: string) => void;
  updateSort: (id: string, sort: ViewSort) => void;
  removeSort: (id: string) => void;
  openSearchBar: () => void;
  closeSearchBar: () => void;
  openSorts: () => void;
  closeSorts: () => void;
  openFieldFilter: (fieldId: string) => void;
  closeFieldFilter: (fieldId: string) => void;
}

export const ViewSearchContext = createContext<ViewSearchContext>(
  {} as ViewSearchContext,
);

export const useViewSearch = () => useContext(ViewSearchContext);
