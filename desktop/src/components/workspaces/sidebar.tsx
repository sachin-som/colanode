import React from 'react';
import { SidebarHeader } from '@/components/workspaces/sidebar-header';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { SidebarSpaces } from '@/components/workspaces/sidebar-spaces';
import { Node } from '@/types/nodes';
import { SidebarContext } from '@/contexts/sidebar';
import { observer } from 'mobx-react-lite';
import { Spinner } from '@/components/ui/spinner';
import { mapNode } from '@/lib/nodes';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';

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
  const { data, isPending } = useQuery({
    queryKey: [`sidebar:${workspace.id}`],
    queryFn: async ({ queryKey }) => {
      const query = workspace.schema
        .selectFrom('nodes')
        .selectAll()
        .where((qb) =>
          qb.or([
            qb.eb('type', '=', 'space'),
            qb.eb(
              'parent_id',
              'in',
              qb.selectFrom('nodes').select('id').where('type', '=', 'space'),
            ),
          ]),
        )
        .compile();

      const queryId = queryKey[0];
      return await workspace.executeQueryAndSubscribe(queryId, query);
    },
  });

  if (isPending) {
    return <Spinner />;
  }

  const currentLayout = 'spaces';
  const nodes: Node[] = data?.rows.map((row) => mapNode(row)) ?? [];

  return (
    <SidebarContext.Provider
      value={{
        nodes: nodes,
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
