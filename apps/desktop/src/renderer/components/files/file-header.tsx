import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { FileNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { ContainerBreadcrumb } from '@/renderer/components/workspaces/containers/container-breadcrumb';
import { FileSettings } from '@/renderer/components/files/file-settings';

interface FileHeaderProps {
  nodes: Node[];
  file: FileNode;
  role: NodeRole;
}

export const FileHeader = ({ nodes, file }: FileHeaderProps) => {
  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <ContainerBreadcrumb nodes={nodes} />
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={file.id} nodes={nodes} />
          <FileSettings nodeId={file.id} />
        </div>
      </div>
    </Header>
  );
};
