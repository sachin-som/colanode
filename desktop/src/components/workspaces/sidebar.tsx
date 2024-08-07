import React from 'react';
import { SidebarHeader } from '@/components/workspaces/sidebar-header';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { SidebarSpaces } from '@/components/workspaces/sidebar-spaces';
import { useWorkspace } from '@/contexts/workspace';
import { useEventBus } from '@/hooks/use-event-bus';
import { Node } from '@/types/nodes';
import { SidebarContext } from '@/contexts/sidebar';
import { SidebarStore } from '@/store/sidebar';
import { observer } from 'mobx-react-lite';

interface LayoutItem {
  name: string;
  alias: string;
  icon: string;
}

const layouts: LayoutItem[] = [
  {
    name: 'Chats',
    alias: 'chat',
    icon: 'chat-1-line',
  },
  {
    name: 'Spaces',
    alias: 'space',
    icon: 'apps-line',
  },
];

export const Sidebar = observer(() => {
  const workspace = useWorkspace();
  const eventBus = useEventBus();
  const store = React.useMemo(() => new SidebarStore(), [workspace.id]);

  React.useEffect(() => {
    const fetchNodes = async () => {
      store.setIsLoading(true);

      const nodes = await workspace.getSidebarNodes();
      store.setNodes(nodes);

      store.setIsLoading(false);
    };

    fetchNodes();

    const subscriptionId = eventBus.subscribe((event) => {
      if (event.event === 'node_created') {
        const createdNode = event.payload as Node;
        if (store.getNode(createdNode.id) || !createdNode.parentId) {
          store.setNode(createdNode);
        } else {
          const parent = store.getNode(createdNode.parentId);
          if (parent) {
            store.setNode(createdNode);
          }
        }
      }

      if (event.event === 'node_updated') {
        const updatedNode = event.payload as Node;
        store.setNode(updatedNode);
      }

      if (event.event === 'node_deleted') {
        const deletedNodeId = event.payload as string;
        store.deleteNode(deletedNodeId);
      }
    });

    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, [workspace.id]);

  const currentLayout = 'spaces';

  return (
    <SidebarContext.Provider
      value={{
        nodes: store.getNodes(),
      }}
    >
      <div className="grid h-full max-h-screen w-full grid-cols-[4rem_1fr] grid-rows-[auto_1fr_auto] border-r border-gray-200">
        <div className="col-span-2 h-12">
          <SidebarHeader />
        </div>
        <ul className="mt-2 w-16 border-r border-gray-100 px-1">
          {layouts.map((layout) => {
            return (
              <li
                role="presentation"
                key={layout.alias}
                className={cn(
                  'relative mb-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md p-2 hover:bg-gray-100',
                  currentLayout === layout.alias && 'bg-gray-100',
                )}
                onClick={() => {}}
              >
                <Icon
                  name={layout.icon}
                  className={cn(
                    'h-5 w-5',
                    currentLayout === layout.alias
                      ? 'font-bold shadow-sm'
                      : 'text-muted-foreground',
                  )}
                />
                <span className="py-0.5 text-xs text-muted-foreground">
                  {layout.name}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="relative mt-2 max-h-full flex-grow overflow-hidden px-1">
          <SidebarSpaces />
        </div>
      </div>
    </SidebarContext.Provider>
  );
});
