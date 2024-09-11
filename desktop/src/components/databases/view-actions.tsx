import React from 'react';
import { ViewSettingsButton } from '@/components/databases/view-settings-button';
import { ViewSortButton } from '@/components/databases/view-sort-button';
import { ViewFiltersPopover } from '@/components/databases/filters/view-filters-popover';

interface ViewActionsProps {
  viewId: string;
}

export const ViewActions = ({ viewId }: ViewActionsProps) => {
  return (
    <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
      <ViewSettingsButton />
      <ViewSortButton />
      <ViewFiltersPopover />
    </div>
  );
};
