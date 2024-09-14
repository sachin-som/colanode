import React from 'react';
import { ViewSortNode } from '@/types/databases';
import { Icon } from '@/components/ui/icon';
import { ViewSortAddPopover } from '@/components/databases/sorts/view-sort-add-popover';

interface ViewSortButtonProps {
  viewId: string;
  sorts: ViewSortNode[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ViewSortButton = ({
  viewId,
  sorts,
  open,
  setOpen,
}: ViewSortButtonProps) => {
  if (sorts.length > 0) {
    return (
      <button
        className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <Icon name="sort-desc" />
      </button>
    );
  }

  return (
    <ViewSortAddPopover
      viewId={viewId}
      existingSorts={sorts}
      onCreate={() => setOpen(true)}
    >
      <button className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
        <Icon name="sort-desc" />
      </button>
    </ViewSortAddPopover>
  );
};
