import React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { View } from '@/renderer/components/databases/view';
import { ScrollBar } from '@/renderer/components/ui/scroll-area';
import { useDatabase } from '@/renderer/contexts/database';
import { DatabaseViewsContext } from '@/renderer/contexts/database-views';

export const DatabaseViews = () => {
  const database = useDatabase();
  const [activeViewId, setActiveViewId] = React.useState<string>(
    database.views[0]?.id ?? ''
  );
  const activeView = database.views.find((view) => view.id === activeViewId);

  React.useEffect(() => {
    if (!activeView) {
      setActiveViewId(database.views[0]?.id ?? '');
    }
  }, [database.views, activeViewId]);

  return (
    <DatabaseViewsContext.Provider
      value={{ views: database.views, activeViewId, setActiveViewId }}
    >
      <div className="h-full w-full overflow-y-auto">
        <ScrollAreaPrimitive.Root className="relative overflow-hidden">
          <ScrollAreaPrimitive.Viewport className="group/database h-full max-h-[calc(100vh-130px)] w-full overflow-y-auto rounded-[inherit] px-10 pb-12">
            {activeView && <View view={activeView} />}
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </div>
    </DatabaseViewsContext.Provider>
  );
};
