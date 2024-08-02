import React from 'react';
import {SpaceCreateButton} from "@/components/spaces/space-create-button";
import {useWorkspace} from "@/contexts/workspace";
import {SidebarNode} from "@/components/workspaces/sidebar-node";
import {observer} from "mobx-react-lite";

export const SidebarSpaces = observer(() => {
  const workspace = useWorkspace();
  const spaces =  workspace.getNodes()
    .filter((node) => node.type === 'space');

  return (
    <div className="pt-3 first:pt-0">
      <div className="flex items-center justify-between p-1 pb-2 text-xs text-muted-foreground">
        <span>Spaces</span>
        <SpaceCreateButton />
      </div>
      <div className="flex flex-col gap-0.5">
        {spaces.map((space) => (
          <SidebarNode node={space} key={space.id} />
        ))}
      </div>
    </div>
  )
});