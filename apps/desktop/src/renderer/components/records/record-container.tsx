import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { extractNodeRole } from '@colanode/core';
import { RecordHeader } from '@/renderer/components/records/record-header';
import { RecordBody } from '@/renderer/components/records/record-body';

interface RecordContainerProps {
  nodeId: string;
}

export const RecordContainer = ({ nodeId }: RecordContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'node_with_ancestors_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const nodes = data ?? [];
  const record = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!record || record.type !== 'record' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <RecordHeader nodes={nodes} record={record} role={role} />
      <RecordBody record={record} />
    </div>
  );
};
