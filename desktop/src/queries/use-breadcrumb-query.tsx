import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { mapNode } from '@/lib/nodes';
import { BreadcrumbNode } from '@/types/workspaces';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useBreadcrumbQuery = (nodeId: string) => {
  const workspace = useWorkspace();
  return useQuery<QueryResult<SelectNode>, Error, BreadcrumbNode[], string[]>({
    queryKey: ['breadcrumb', nodeId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        WITH RECURSIVE breadcrumb_nodes AS (
          SELECT *
          FROM nodes
          WHERE id = ${nodeId}
          UNION ALL
          SELECT n.*
          FROM nodes n
          INNER JOIN breadcrumb_nodes b ON n.id = b.parent_id
        )
        SELECT n.*
        FROM breadcrumb_nodes n;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNode>): BreadcrumbNode[] => {
      const rows = data?.rows ?? [];
      return buildBreadcrumbNodes(nodeId, rows);
    },
  });
};

const buildBreadcrumbNodes = (
  nodeId: string,
  rows: SelectNode[],
): BreadcrumbNode[] => {
  const breadcrumbNodes: BreadcrumbNode[] = [];

  let currentId = nodeId;
  while (currentId !== null && currentId !== undefined) {
    const row = rows.find((row) => row.id === currentId);
    if (row) {
      breadcrumbNodes.push(buildBreadcrumbNode(row));
      currentId = row.parent_id;
    } else {
      currentId = null;
    }
  }
  return breadcrumbNodes.reverse();
};

const buildBreadcrumbNode = (row: SelectNode): BreadcrumbNode => {
  const node = mapNode(row);

  const name = node.attributes.name;
  const avatar = node.attributes.avatar;

  return {
    id: node.id,
    type: node.type,
    name,
    avatar,
  };
};
