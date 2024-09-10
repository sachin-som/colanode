import React from 'react';
import { ViewTab } from '@/components/databases/view-tab';
import { ViewActions } from '@/components/databases/view-actions';
import { ViewNode } from '@/types/databases';
import { View } from '@/components/databases/view';
import { ViewCreateButton } from '@/components/databases/view-create-button';

interface DatabaseViewsProps {
  views: ViewNode[];
}

export const DatabaseViews = ({ views }: DatabaseViewsProps) => {
  const [selectedView, setSelectedView] = React.useState<ViewNode | null>(
    views.length > 0 ? views[0] : null,
  );

  return (
    <div className="group/database">
      <div className="mt-2 flex flex-row justify-between border-b">
        <div className="flex flex-row items-center gap-3">
          {views.map((view) => (
            <ViewTab
              key={view.id}
              view={view}
              isActive={view.id === selectedView?.id}
              onClick={() => setSelectedView(view)}
            />
          ))}
          <ViewCreateButton />
        </div>
        <ViewActions />
      </div>
      {selectedView && <View node={selectedView} />}
    </div>
  );
};
