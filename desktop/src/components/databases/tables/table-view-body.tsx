import React from 'react';
import { useDatabase } from '@/contexts/database';
import { useWorkspace } from '@/contexts/workspace';
import { useQuery } from '@tanstack/react-query';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { TableViewRow } from '@/components/databases/tables/table-view-row';
import { TableViewEmptyPlaceholder } from '@/components/databases/tables/table-view-empty-placeholder';

export const TableViewBody = () => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const { data, isPending } = useQuery({
    queryKey: ['view', 'records', database.id],
    queryFn: async ({ queryKey }) => {
      const query = workspace.schema
        .selectFrom('nodes')
        .selectAll()
        .where('parent_id', '=', database.id)
        .where('type', '=', NodeTypes.Record)
        .compile();

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
  });

  if (isPending) {
    return null;
  }

  const recordNodes = data?.rows.map((row) => mapNode(row)) ?? [];
  return (
    <div className="border-t">
      {recordNodes.length === 0 && <TableViewEmptyPlaceholder />}
      {recordNodes.map((node, index) => (
        <TableViewRow key={node.id} index={index} node={node} />
      ))}
    </div>
  );
};
