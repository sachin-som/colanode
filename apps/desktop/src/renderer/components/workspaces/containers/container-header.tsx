import { getIdType, IdType } from '@colanode/core';
import { Breadcrumb } from '@/renderer/components/workspaces/containers/breadcrumb';
import { ChatBreadcrumb } from '@/renderer/components/workspaces/containers/chat-breadcrumb';
import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { SidebarTrigger } from '@/renderer/components/ui/sidebar';
import { Separator } from '@/renderer/components/ui/separator';
import { ContainerSettings } from '@/renderer/components/workspaces/containers/container-settings';

interface ContainerHeaderProps {
  nodeId: string;
}

export const ContainerHeader = ({ nodeId }: ContainerHeaderProps) => {
  const idType = getIdType(nodeId);
  return (
    <header className="flex h-16 w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex-grow">
          {idType === IdType.Chat ? (
            <ChatBreadcrumb chatId={nodeId} />
          ) : (
            <Breadcrumb nodeId={nodeId} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={nodeId} />
          <ContainerSettings nodeId={nodeId} />
        </div>
      </div>
    </header>
  );
};
