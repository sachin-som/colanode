import React from 'react';
import { ViewSettingsButton } from '@/components/databases/view-settings-button';
import { ViewSortButton } from '@/components/databases/view-sort-button';
import { ViewFilterButton } from '@/components/databases/view-filter-button';

export const ViewActions = () => {
  return (
    <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
      <ViewSettingsButton />
      <ViewSortButton />
      <ViewFilterButton />
    </div>
  );
};
