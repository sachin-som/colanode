import React from 'react';
import { ViewTab } from '@/components/databases/view-tab';
import { ViewCreateButton } from '@/components/databases/view-create-button';
import { useDatabaseViews } from '@/contexts/database-views';

export const ViewTabs = () => {
  const databaseViews = useDatabaseViews();

  return (
    <div className="flex flex-row items-center gap-3">
      {databaseViews.views.map((view) => (
        <ViewTab
          key={view.id}
          view={view}
          isActive={view.id === databaseViews.activeViewId}
          onClick={() => databaseViews.setActiveViewId(view.id)}
        />
      ))}
      <ViewCreateButton />
    </div>
  );
};
