import { NodeCollaboratorsPopover } from '@/renderer/components/collaborators/node-collaborators-popover';
import { RecordNode, Node, NodeRole } from '@colanode/core';
import { Header } from '@/renderer/components/ui/header';
import { ContainerBreadcrumb } from '@/renderer/components/workspaces/containers/container-breadcrumb';
import { RecordSettings } from '@/renderer/components/records/record-settings';

interface RecordHeaderProps {
  nodes: Node[];
  record: RecordNode;
  role: NodeRole;
}

export const RecordHeader = ({ nodes, record }: RecordHeaderProps) => {
  return (
    <Header>
      <div className="flex w-full items-center gap-2 px-4">
        <ContainerBreadcrumb nodes={nodes} />
        <div className="flex items-center gap-2">
          <NodeCollaboratorsPopover nodeId={record.id} nodes={nodes} />
          <RecordSettings nodeId={record.id} />
        </div>
      </div>
    </Header>
  );
};
