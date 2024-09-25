import React from 'react';
import { ViewSorts } from '@/components/databases/search/view-sorts';
import { ViewFilters } from '@/components/databases/search/view-filters';
import { Separator } from '@/components/ui/separator';
import { useViewSearch } from '@/contexts/view-search';

export const ViewSearchBar = () => {
  const viewSearch = useViewSearch();

  if (!viewSearch.isSearchBarOpened) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-row items-center gap-2">
      {viewSearch.sorts.length > 0 && (
        <React.Fragment>
          <ViewSorts />
          <Separator orientation="vertical" className="mx-1 h-4" />
        </React.Fragment>
      )}
      <ViewFilters />
    </div>
  );
};
