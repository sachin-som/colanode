import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { FolderNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { ContainerBreadcrumb } from '@/renderer/components/workspaces/containers/container-breadcrumb';
import { FolderSettings } from '@/renderer/components/folders/folder-settings';

interface FolderHeaderProps {
  nodes: Node[];
  folder: FolderNode;
  role: NodeRole;
}

export const FolderHeader = ({ nodes, folder }: FolderHeaderProps) => {
  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <ContainerBreadcrumb nodes={nodes} />
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={folder.id} nodes={nodes} />
          <FolderSettings nodeId={folder.id} />
        </div>
      </div>
    </Header>
  );
};
