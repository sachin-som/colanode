import React from 'react';
import { SpaceCreateButton } from '@/components/spaces/space-create-button';
import { SidebarSpaceItem } from '@/components/workspaces/sidebars/sidebar-space-item';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/contexts/workspace';

export const SidebarSpaces = () => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'sidebar_space_list',
    userId: workspace.userId,
  });

  return (
    <div className="pt-2 first:pt-0">
      <div className="flex items-center justify-between p-1 pb-2 text-xs text-muted-foreground">
        <span>Spaces</span>
        <SpaceCreateButton />
      </div>
      <div className="flex flex-col gap-0.5">
        {data?.map((space) => <SidebarSpaceItem node={space} key={space.id} />)}
      </div>
    </div>
  );
};
