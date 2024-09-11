import React from 'react';
import { DatabaseContext } from '@/contexts/database';
import { DatabaseNode } from '@/types/databases';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { View } from '@/components/databases/view';

interface DatabaseProps {
  node: DatabaseNode;
}

export const Database = ({ node }: DatabaseProps) => {
  const [activeViewId, setActiveViewId] = React.useState<string>(
    node.views[0].id,
  );
  const activeView = node.views.find((view) => view.id === activeViewId);

  React.useEffect(() => {
    if (!activeView) {
      setActiveViewId(node.views[0].id);
    }
  }, [node.views, activeViewId]);

  return (
    <DatabaseContext.Provider
      value={{
        id: node.id,
        name: node.name,
        fields: node.fields,
        views: node.views,
        activeViewId: activeViewId,
        setActiveViewId: setActiveViewId,
      }}
    >
      <ScrollArea className="group/database h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        {activeView && <View node={activeView} />}
      </ScrollArea>
    </DatabaseContext.Provider>
  );
};
