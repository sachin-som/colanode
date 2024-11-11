import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { DatabaseNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { ContainerBreadcrumb } from '@/renderer/components/workspaces/containers/container-breadcrumb';
import { DatabaseSettings } from '@/renderer/components/databases/database-settings';

interface DatabaseHeaderProps {
  nodes: Node[];
  database: DatabaseNode;
  role: NodeRole;
}

export const DatabaseHeader = ({ nodes, database }: DatabaseHeaderProps) => {
  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <ContainerBreadcrumb nodes={nodes} />
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={database.id} nodes={nodes} />
          <DatabaseSettings nodeId={database.id} />
        </div>
      </div>
    </Header>
  );
};
