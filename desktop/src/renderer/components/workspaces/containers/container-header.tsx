import React from 'react';
import { Breadcrumb } from '@/renderer/components/workspaces/containers/breadcrumb';
import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';

interface ContainerHeaderProps {
  nodeId: string;
}

export const ContainerHeader = ({ nodeId }: ContainerHeaderProps) => {
  return (
    <div className="mx-1 flex h-12 items-center justify-between p-2 pr-4 text-foreground/80">
      <Breadcrumb nodeId={nodeId} />
      <NodeCollaboratorsPopover nodeId={nodeId} />
    </div>
  );
};
