import React from 'react';
import { LocalNode } from '@/types/nodes';
import { Breadcrumb } from '@/components/workspaces/containers/breadcrumb';
import { NodeCollaboratorsPopover } from '@/components/collaborators/node-collaborators-popover';

interface ContainerHeaderProps {
  node: LocalNode;
}

export const ContainerHeader = ({ node }: ContainerHeaderProps) => {
  return (
    <div className="mx-1 flex h-12 items-center justify-between p-2 pr-4 text-foreground/80">
      <Breadcrumb node={node} />
      <NodeCollaboratorsPopover id={node.id} />
    </div>
  );
};
