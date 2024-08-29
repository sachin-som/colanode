import React from 'react';
import { SidebarHeader } from '@/components/workspaces/sidebar-header';
import { SidebarSpaces } from '@/components/workspaces/sidebar-spaces';
import { LocalNode } from '@/types/nodes';
import { SidebarContext } from '@/contexts/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { mapNode } from '@/lib/nodes';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { Icon } from '@/components/ui/icon';
import { SpacebarChats } from '@/components/workspaces/spacebar-chats';

export const Sidebar = () => {
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
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });

  if (isPending) {
    return <Spinner />;
  }

  const nodes: LocalNode[] = data?.rows.map((row) => mapNode(row)) ?? [];
  return (
    <SidebarContext.Provider
      value={{
        nodes: nodes,
      }}
    >
      <div className="h-full max-h-screen w-full border-r border-gray-200">
        <SidebarHeader />
        <div className="relative mt-2 max-h-full flex-grow overflow-hidden px-2">
          <div className="flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100">
            <Icon name="search-line" className="mr-2 h-4 w-4" />
            <span>Search</span>
          </div>
          <div className="flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100">
            <Icon name="inbox-line" className="mr-2 h-4 w-4" />
            <span>Inbox</span>
          </div>
          <SpacebarChats />
          <SidebarSpaces />
        </div>
      </div>
    </SidebarContext.Provider>
  );
};
