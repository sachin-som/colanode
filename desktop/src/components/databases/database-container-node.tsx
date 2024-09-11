import React from 'react';
import { LocalNode } from '@/types/nodes';
import { useDatabaseQuery } from '@/queries/use-database-query';
import { Database } from '@/components/databases/database';

interface DatabaseContainerNodeProps {
  node: LocalNode;
}

export const DatabaseContainerNode = ({ node }: DatabaseContainerNodeProps) => {
  const { data, isPending } = useDatabaseQuery(node.id);

  if (isPending) {
    return null;
  }

  if (!data) {
    return null;
  }

  return <Database node={data} />;
};
