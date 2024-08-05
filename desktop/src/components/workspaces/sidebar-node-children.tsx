import React from 'react';
import { Node } from '@/types/nodes';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '@/contexts/workspace';
import { SidebarNode } from '@/components/workspaces/sidebar-node';

interface SidebarNodeChildrenProps {
  node: Node;
}

export const SidebarNodeChildren = observer(
  ({ node }: SidebarNodeChildrenProps) => {
    const workspace = useWorkspace();
    const children: Node[] = workspace
      .getNodes()
      .filter((n) => n.parentId === node.id)
      .sort((a, b) => {
        if (a.index < b.index) {
          return -1;
        } else if (a.index > b.index) {
          return 1;
        }

        return 0;
      });

    return (
      <React.Fragment>
        {children.map((child) => (
          <SidebarNode key={child.id} node={child} />
        ))}
      </React.Fragment>
    );
  },
);
