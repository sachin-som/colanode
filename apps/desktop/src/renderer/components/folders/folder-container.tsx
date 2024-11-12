import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { extractNodeRole } from '@colanode/core';
import { FolderHeader } from '@/renderer/components/folders/folder-header';
import { FolderBody } from './folder-body';

interface FolderContainerProps {
  nodeId: string;
}

export const FolderContainer = ({ nodeId }: FolderContainerProps) => {
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
  const folder = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!folder || folder.type !== 'folder' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <FolderHeader nodes={nodes} folder={folder} role={role} />
      <FolderBody folder={folder} />
    </div>
  );
};
