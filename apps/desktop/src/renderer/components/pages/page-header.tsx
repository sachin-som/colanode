import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { PageNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { ContainerBreadcrumb } from '@/renderer/components/workspaces/containers/container-breadcrumb';
import { PageSettings } from '@/renderer/components/pages/page-settings';

interface PageHeaderProps {
  nodes: Node[];
  page: PageNode;
  role: NodeRole;
}

export const PageHeader = ({ nodes, page }: PageHeaderProps) => {
  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <ContainerBreadcrumb nodes={nodes} />
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={page.id} nodes={nodes} />
          <PageSettings nodeId={page.id} />
        </div>
      </div>
    </Header>
  );
};
