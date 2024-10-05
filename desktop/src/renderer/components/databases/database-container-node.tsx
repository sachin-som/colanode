import React from 'react';
import { useQuery } from '@/renderer/hooks/use-query';
import { Database } from '@/renderer/components/databases/database';
import { DatabaseViews } from '@/renderer/components/databases/database-views';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DatabaseContainerNodeProps {
  nodeId: string;
}

export const DatabaseContainerNode = ({
  nodeId,
}: DatabaseContainerNodeProps) => {
  const workspace = useWorkspace();

  const { data: views, isPending: isViewsPending } = useQuery({
    type: 'database_view_list',
    databaseId: nodeId,
    userId: workspace.userId,
  });

  if (isViewsPending) {
    return null;
  }

  if (!views) {
    return null;
  }

  return (
    <Database databaseId={nodeId}>
      {views && <DatabaseViews views={views} />}
    </Database>
  );
};
