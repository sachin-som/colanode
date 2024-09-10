import React from 'react';
import { ViewNode } from '@/types/databases';
import { TableView } from '@/components/databases/tables/table-view';

interface ViewProps {
  node: ViewNode;
}

export const View = ({ node }: ViewProps) => {
  if (node.type === 'table_view') {
    return <TableView node={node} />;
  }

  return null;
};
