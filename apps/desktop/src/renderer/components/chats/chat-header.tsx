import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { ChatNode } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { ContainerBreadcrumb } from '@/renderer/components/workspaces/containers/container-breadcrumb';

interface ChatHeaderProps {
  chat: ChatNode;
}

export const ChatHeader = ({ chat }: ChatHeaderProps) => {
  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <ContainerBreadcrumb nodes={[chat]} />
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={chat.id} nodes={[chat]} />
        </div>
      </div>
    </Header>
  );
};
