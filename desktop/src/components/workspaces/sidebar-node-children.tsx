import React from 'react';
import { LocalNode } from '@/types/nodes';
import { SidebarNode } from '@/components/workspaces/sidebar-node';
import { useSidebar } from '@/contexts/sidebar';
import { compareString } from '@/lib/utils';

interface SidebarNodeChildrenProps {
  node: LocalNode;
}

export const SidebarNodeChildren = ({ node }: SidebarNodeChildrenProps) => {
  const sidebar = useSidebar();
  const children: LocalNode[] = sidebar.nodes
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => compareString(a.index, b.index));

  return (
    <React.Fragment>
      {children.map((child) => (
        <SidebarNode key={child.id} node={child} />
      ))}
    </React.Fragment>
  );
};
