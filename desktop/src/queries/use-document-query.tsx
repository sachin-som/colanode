import { useWorkspace } from '@/contexts/workspace';
import { SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';
import { LocalNodeWithAttributes } from '@/types/nodes';
import { mapNodeWithAttributes } from '@/lib/nodes';

export const useDocumentQuery = (id: string) => {
  const workspace = useWorkspace();

  return useQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    Map<string, LocalNodeWithAttributes>,
    string[]
  >({
    queryKey: ['document', id],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNodeWithAttributes>`
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
        SELECT 
            n.*,
            json_group_array(
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
                'updated_by', na.updated_by,
                'version_id', na.'version_id',
                'server_created_at', na.'server_created_at',
                'server_updated_at', na.'server_updated_at',
                'server_version_id', na.'server_version_id'
              )
            ) as attributes
          FROM document_nodes n
          LEFT JOIN node_attributes na ON n.id = na.node_id
          GROUP BY n.id;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        query,
        key: queryKey,
      });
    },
    select: (data) => buildMap(data?.rows ?? []),
  });
};

const buildMap = (
  rows: SelectNodeWithAttributes[],
): Map<string, LocalNodeWithAttributes> => {
  const map = new Map<string, LocalNodeWithAttributes>();
  rows.forEach((row) => {
    map.set(row.id, mapNodeWithAttributes(row));
  });
  return map;
};
