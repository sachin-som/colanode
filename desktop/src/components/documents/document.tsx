import React from 'react';
import { LocalNode } from '@/types/nodes';
import { DocumentEditor } from './document-editor';
import { useQuery } from '@tanstack/react-query';
import { sql } from 'kysely';
import { SelectNode } from '@/data/schemas/workspace';
import { useWorkspace } from '@/contexts/workspace';
import { mapNode } from '@/lib/nodes';

interface DocumentProps {
  node: LocalNode;
}

export const Document = ({ node }: DocumentProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    queryKey: [`document:nodes:${node.id}`],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        WITH RECURSIVE document_hierarchy AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${node.id}
            
            UNION ALL
            
            SELECT child.*
            FROM nodes child
            INNER JOIN document_hierarchy parent ON child.parent_id = parent.id
        )
        SELECT *
        FROM document_hierarchy;
      `.compile(workspace.schema);

      const queryId = queryKey[0];
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });

  if (isPending) {
    return null;
  }

  const rows = data.rows;
  const nodes = rows.map((row) => mapNode(row));
  return <DocumentEditor key={node.id} node={node} nodes={nodes} />;
};
