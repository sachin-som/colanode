import React from 'react';
import { getIdType, IdType } from '@/lib/id';
import { Breadcrumb } from '@/renderer/components/workspaces/containers/breadcrumb';
import { ChatBreadcrumb } from '@/renderer/components/workspaces/containers/chat-breadcrumb';
import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';

interface ContainerHeaderProps {
  nodeId: string;
}

export const ContainerHeader = ({ nodeId }: ContainerHeaderProps) => {
  const idType = getIdType(nodeId);
  return (
    <div className="mx-1 flex h-12 items-center justify-between p-2 pr-4 text-foreground/80">
      {idType === IdType.Chat ? (
        <ChatBreadcrumb chatId={nodeId} />
      ) : (
        <Breadcrumb nodeId={nodeId} />
      )}
      <NodeCollaboratorsPopover nodeId={nodeId} />
    </div>
  );
};
