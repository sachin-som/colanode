import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';
import { LocalNode } from '@/types/nodes';
import { mapNode } from '@/lib/nodes';

export const useDocumentQuery = (id: string) => {
  const workspace = useWorkspace();

  return useQuery<
    QueryResult<SelectNode>,
    Error,
    Map<string, LocalNode>,
    string[]
  >({
    queryKey: ['document', id],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        WITH RECURSIVE document_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${id}
            
            UNION ALL
            
            SELECT child.*
            FROM nodes child
            INNER JOIN document_nodes parent ON child.parent_id = parent.id
            WHERE parent.type NOT IN (${NodeTypes.Page})
        )
        SELECT *
        FROM document_nodes
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        query,
        key: queryKey,
      });
    },
    select: (data) => buildMap(data?.rows ?? []),
  });
};

const buildMap = (rows: SelectNode[]): Map<string, LocalNode> => {
  const map = new Map<string, LocalNode>();
  rows.forEach((row) => {
    map.set(row.id, mapNode(row));
  });
  return map;
};
