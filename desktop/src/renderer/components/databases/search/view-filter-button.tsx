import React from 'react';
import { ViewFilterAddPopover } from '@/renderer/components/databases/search/view-filter-add-popover';
import { useViewSearch } from '@/renderer/contexts/view-search';
import { Filter } from 'lucide-react';

export const ViewFilterButton = () => {
  const viewSearch = useViewSearch();

  if (viewSearch.filters.length > 0) {
    return (
      <button
        className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
        onClick={() => viewSearch.openSearchBar()}
      >
        <Filter className="size-4" />
      </button>
    );
  }

  return (
    <ViewFilterAddPopover>
      <button className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
        <Filter className="size-4" />
      </button>
    </ViewFilterAddPopover>
  );
};
