import React from 'react';
import { LocalNode } from '@/types/nodes';
import { useQuery } from '@/renderer/hooks/use-query';
import { Database } from '@/components/databases/database';
import { DatabaseViews } from '@/components/databases/database-views';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DatabaseContainerNodeProps {
  node: LocalNode;
}

export const DatabaseContainerNode = ({ node }: DatabaseContainerNodeProps) => {
  const workspace = useWorkspace();

  const { data: database, isPending: isDatabasePending } = useQuery({
    type: 'database_get',
    databaseId: node.id,
    userId: workspace.userId,
  });

  const { data: views, isPending: isViewsPending } = useQuery({
    type: 'database_view_list',
    databaseId: node.id,
    userId: workspace.userId,
  });

  if (isDatabasePending || isViewsPending) {
    return null;
  }

  if (!database) {
    return null;
  }

  return (
    <Database node={database}>
      {views && <DatabaseViews views={views} />}
    </Database>
  );
};
