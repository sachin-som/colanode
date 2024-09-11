import React from 'react';
import { ViewTab } from '@/components/databases/view-tab';
import { ViewCreateButton } from '@/components/databases/view-create-button';
import { useDatabase } from '@/contexts/database';

export const ViewTabs = () => {
  const database = useDatabase();

  return (
    <div className="flex flex-row items-center gap-3">
      {database.views.map((view) => (
        <ViewTab
          key={view.id}
          view={view}
          isActive={view.id === database.activeViewId}
          onClick={() => database.setActiveViewId(view.id)}
        />
      ))}
      <ViewCreateButton />
    </div>
  );
};
