import { useWorkspace } from '@/contexts/workspace';
import { SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes } from '@/lib/constants';
import { mapNodeWithAttributes } from '@/lib/nodes';
import { BreadcrumbNode } from '@/types/workspaces';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useBreadcrumbQuery = (nodeId: string) => {
  const workspace = useWorkspace();
  return useQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    BreadcrumbNode[],
    string[]
  >({
    queryKey: ['breadcrumb', nodeId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNodeWithAttributes>`
        WITH RECURSIVE breadcrumb_nodes AS (
          SELECT *
          FROM nodes
          WHERE id = ${nodeId}
          UNION ALL
          SELECT n.*
          FROM nodes n
          INNER JOIN breadcrumb_nodes b ON n.id = b.parent_id
        )
        SELECT 
            n.*,
            CASE 
              WHEN COUNT(na.node_id) = 0 THEN json('[]')
              ELSE json_group_array(
                json_object(
                  'node_id', na.'node_id',
                  'type', na.'type',
                  'key', na.'key',
                  'text_value', na.'text_value',
                  'number_value', na.'number_value',
                  'foreign_node_id', na.'foreign_node_id',
                  'created_at', na.'created_at',
                  'updated_at', na.'updated_at',
                  'created_by', na.'created_by',
                  'updated_by', na.'updated_by',
                  'version_id', na.'version_id',
                  'server_created_at', na.'server_created_at',
                  'server_updated_at', na.'server_updated_at',
                  'server_version_id', na.'server_version_id'
                )
              )
            END as attributes
          FROM breadcrumb_nodes n
          LEFT JOIN node_attributes na ON n.id = na.node_id
          GROUP BY n.id;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNodeWithAttributes>): BreadcrumbNode[] => {
      const rows = data?.rows ?? [];
      return buildBreadcrumbNodes(nodeId, rows);
    },
  });
};

const buildBreadcrumbNodes = (
  nodeId: string,
  rows: SelectNodeWithAttributes[],
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

const buildBreadcrumbNode = (row: SelectNodeWithAttributes): BreadcrumbNode => {
  const nodeWithAttributes = mapNodeWithAttributes(row);

  const name = nodeWithAttributes.attributes.find(
    (attr) => attr.type === AttributeTypes.Name,
  )?.textValue;

  const avatar = nodeWithAttributes.attributes.find(
    (attr) => attr.type === AttributeTypes.Avatar,
  )?.textValue;

  return {
    id: nodeWithAttributes.id,
    type: nodeWithAttributes.type,
    name,
    avatar,
  };
};
