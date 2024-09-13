import React from 'react';
import { LocalNode } from '@/types/nodes';
import { useDatabaseQuery } from '@/queries/use-database-query';
import { Database } from '@/components/databases/database';
import { DatabaseViews } from '@/components/databases/database-views';
import { useDatabaseViewsQuery } from '@/queries/use-database-views-query';

interface DatabaseContainerNodeProps {
  node: LocalNode;
}

export const DatabaseContainerNode = ({ node }: DatabaseContainerNodeProps) => {
  const { data: database, isPending: isDatabasePending } = useDatabaseQuery(
    node.id,
  );
  const { data: views, isPending: isViewsPending } = useDatabaseViewsQuery(
    node.id,
  );

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
