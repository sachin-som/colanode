import React from 'react';
import { DatabaseViewsContext } from '@/contexts/database-views';
import { ViewNode } from '@/types/databases';
import { View } from '@/components/databases/view';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DatabaseViewsProps {
  views: ViewNode[];
}

export const DatabaseViews = ({ views }: DatabaseViewsProps) => {
  const [activeViewId, setActiveViewId] = React.useState<string>(views[0].id);
  const activeView = views.find((view) => view.id === activeViewId);

  React.useEffect(() => {
    if (!activeView) {
      setActiveViewId(views[0].id);
    }
  }, [views, activeViewId]);

  return (
    <DatabaseViewsContext.Provider
      value={{ views, activeViewId, setActiveViewId }}
    >
      <ScrollArea className="group/database h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        {activeView && <View node={activeView} />}
      </ScrollArea>
    </DatabaseViewsContext.Provider>
  );
};
