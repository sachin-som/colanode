import React from 'react';
import { ViewFilterAddPopover } from '@/components/databases/search/view-filter-add-popover';
import { Icon } from '@/components/ui/icon';
import { useViewSearch } from '@/contexts/view-search';

export const ViewFilterButton = () => {
  const viewSearch = useViewSearch();

  if (viewSearch.filters.length > 0) {
    return (
      <button
        className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
        onClick={() => viewSearch.openSearchBar()}
      >
        <Icon name="filter-line" />
      </button>
    );
  }

  return (
    <ViewFilterAddPopover>
      <button className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
        <Icon name="filter-line" />
      </button>
    </ViewFilterAddPopover>
  );
};
