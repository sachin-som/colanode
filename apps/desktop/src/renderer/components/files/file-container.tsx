import { extractNodeRole } from '@colanode/core';

import { FileBody } from '@/renderer/components/files/file-body';
import { FileHeader } from '@/renderer/components/files/file-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileContainerProps {
  nodeId: string;
}

export const FileContainer = ({ nodeId }: FileContainerProps) => {
  const workspace = useWorkspace();

  const { data: file, isPending: isFilePending } = useQuery({
    type: 'file_get',
    id: nodeId,
    userId: workspace.userId,
  });

  const { data: nodes, isPending: isNodesPending } = useQuery(
    {
      type: 'node_tree_get',
      nodeId: file?.parentId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!file,
    }
  );

  if (isFilePending || isNodesPending) {
    return null;
  }

  const role = extractNodeRole(nodes ?? [], workspace.userId);
  if (!file || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <FileHeader nodes={nodes ?? []} file={file} role={role} />
      <FileBody file={file} />
    </div>
  );
};
