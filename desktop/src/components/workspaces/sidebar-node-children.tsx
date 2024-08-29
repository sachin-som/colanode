import React from 'react';
import { LocalNode } from '@/types/nodes';
import { SidebarNode } from '@/components/workspaces/sidebar-node';
import { useSidebar } from '@/contexts/sidebar';
import { compareNodeIndex } from '@/lib/nodes';

interface SidebarNodeChildrenProps {
  node: LocalNode;
}

export const SidebarNodeChildren = ({ node }: SidebarNodeChildrenProps) => {
  const sidebar = useSidebar();
  const children: LocalNode[] = sidebar.nodes
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => compareNodeIndex(a, b));

  return (
    <React.Fragment>
      {children.map((child) => (
        <SidebarNode key={child.id} node={child} />
      ))}
    </React.Fragment>
  );
};
