import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { DatabaseHeader } from '@/renderer/components/databases/database-header';
import { extractNodeRole } from '@colanode/core';
import { DatabaseBody } from '@/renderer/components/databases/database-body';

interface DatabaseContainerProps {
  nodeId: string;
}

export const DatabaseContainer = ({ nodeId }: DatabaseContainerProps) => {
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
  const database = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!database || database.type !== 'database' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <DatabaseHeader nodes={nodes} database={database} role={role} />
      <DatabaseBody database={database} role={role} />
    </div>
  );
};
