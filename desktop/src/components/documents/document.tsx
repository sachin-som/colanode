import React from 'react';
import { LocalNode } from '@/types/nodes';
import { DocumentEditor } from './document-editor';
import { useQuery } from '@tanstack/react-query';
import { sql } from 'kysely';
import { SelectNode } from '@/data/schemas/workspace';
import { useWorkspace } from '@/contexts/workspace';
import { mapNode } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';

interface DocumentProps {
  node: LocalNode;
}

export const Document = ({ node }: DocumentProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    queryKey: ['document', 'nodes', node.id],
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
            WHERE parent.type NOT IN (${NodeTypes.Page})
        )
        SELECT *
        FROM document_hierarchy;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        query,
        key: queryKey,
      });
    },
  });

  if (isPending) {
    return null;
  }

  const rows = data.rows;
  const nodes = new Map(rows.map((row) => [row.id, mapNode(row)]));
  return <DocumentEditor key={node.id} node={node} nodes={nodes} />;
};
