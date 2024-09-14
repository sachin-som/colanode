import React from 'react';
import { ViewFilterNode } from '@/types/databases';
import { ViewFilterAddPopover } from '@/components/databases/filters/view-filter-add-popover';
import { Icon } from '@/components/ui/icon';

interface ViewFilterButtonProps {
  viewId: string;
  filters: ViewFilterNode[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ViewFilterButton = ({
  viewId,
  filters,
  open,
  setOpen,
}: ViewFilterButtonProps) => {
  if (filters.length > 0) {
    return (
      <button
        className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <Icon name="filter-line" />
      </button>
    );
  }

  return (
    <ViewFilterAddPopover
      viewId={viewId}
      existingFilters={filters}
      onCreate={() => setOpen(true)}
    >
      <button className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
        <Icon name="filter-line" />
      </button>
    </ViewFilterAddPopover>
  );
};
