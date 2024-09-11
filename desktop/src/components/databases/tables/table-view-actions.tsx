import React from 'react';
import { ViewSortButton } from '@/components/databases/view-sort-button';
import { ViewFiltersPopover } from '@/components/databases/filters/view-filters-popover';
import { TableViewSettingsPopover } from '@/components/databases/tables/table-view-settings-popover';

export const TableViewActions = () => {
  return (
    <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
      <TableViewSettingsPopover />
      <ViewSortButton />
      <ViewFiltersPopover />
    </div>
  );
};
