import React from 'react';
import { SidebarSpaceItem } from '@/renderer/components/workspaces/sidebars/sidebar-space-item';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/renderer/components/ui/sidebar';
import { SpaceCreateButton } from '@/renderer/components/spaces/space-create-button';

export const SidebarSpaces = () => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'sidebar_space_list',
    userId: workspace.userId,
  });

  return (
    <SidebarGroup className="group/sidebar-spaces">
      <SidebarGroupLabel>Spaces</SidebarGroupLabel>
      <SidebarGroupAction className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-spaces:opacity-100">
        <SpaceCreateButton />
      </SidebarGroupAction>
      <SidebarMenu>
        {data?.map((space) => <SidebarSpaceItem node={space} key={space.id} />)}
      </SidebarMenu>
    </SidebarGroup>
  );
};
