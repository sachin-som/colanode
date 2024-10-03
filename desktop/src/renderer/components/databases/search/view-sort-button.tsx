import React from 'react';
import { Icon } from '@/renderer/components/ui/icon';
import { ViewSortAddPopover } from '@/renderer/components/databases/search/view-sort-add-popover';
import { useViewSearch } from '@/renderer/contexts/view-search';

export const ViewSortButton = () => {
  const viewSearch = useViewSearch();

  if (viewSearch.sorts.length > 0) {
    return (
      <button
        className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
        onClick={() => viewSearch.openSearchBar()}
      >
        <Icon name="sort-desc" />
      </button>
    );
  }

  return (
    <ViewSortAddPopover>
      <button className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
        <Icon name="sort-desc" />
      </button>
    </ViewSortAddPopover>
  );
};
