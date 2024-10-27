import React from 'react';
import { ViewSortAddPopover } from '@/renderer/components/databases/search/view-sort-add-popover';
import { useViewSearch } from '@/renderer/contexts/view-search';
import { ArrowDownAz } from 'lucide-react';

export const ViewSortButton = () => {
  const viewSearch = useViewSearch();

  if (viewSearch.sorts.length > 0) {
    return (
      <button
        className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
        onClick={() => viewSearch.openSearchBar()}
      >
        <ArrowDownAz className="size-4" />
      </button>
    );
  }

  return (
    <ViewSortAddPopover>
      <button className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
        <ArrowDownAz className="size-4" />
      </button>
    </ViewSortAddPopover>
  );
};
