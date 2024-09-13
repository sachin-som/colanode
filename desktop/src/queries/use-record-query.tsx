import { useWorkspace } from '@/contexts/workspace';
import { SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { mapNodeWithAttributes } from '@/lib/nodes';
import { RecordNode } from '@/types/databases';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useRecordQuery = (recordId: string) => {
  const workspace = useWorkspace();

  return useQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    RecordNode | null,
    string[]
  >({
    queryKey: ['record', recordId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNodeWithAttributes>`
          WITH record_node AS (
          SELECT *
          FROM nodes
          WHERE id = ${recordId}
        ),
        author_node AS (
          SELECT *
          FROM nodes
          WHERE id IN (SELECT DISTINCT created_by FROM record_node)
        ),
        all_nodes as (
          SELECT * FROM record_node
          UNION ALL
          SELECT * FROM author_node
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
          FROM all_nodes n
          LEFT JOIN node_attributes na ON n.id = na.node_id
          GROUP BY n.id;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (
      data: QueryResult<SelectNodeWithAttributes>,
    ): RecordNode | null => {
      const rows = data?.rows ?? [];
      return buildRecord(recordId, rows);
    },
  });
};

const buildRecord = (
  recordId: string,
  rows: SelectNodeWithAttributes[],
): RecordNode | null => {
  const nodes = rows.map(mapNodeWithAttributes);
  const recordNode = nodes.find((node) => node.id === recordId);
  if (!recordNode) {
    return null;
  }

  const recordName = recordNode.attributes.find(
    (attr) => attr.type === AttributeTypes.Name,
  )?.textValue;

  const authorNode = nodes.find((node) => node.type === NodeTypes.User);
  const author = authorNode
    ? {
        id: authorNode.id,
        name: authorNode.attributes.find(
          (attr) => attr.type === AttributeTypes.Name,
        )?.textValue,
        avatar: authorNode.attributes.find(
          (attr) => attr.type === AttributeTypes.Avatar,
        )?.textValue,
      }
    : {
        id: recordNode.createdBy,
        name: 'Unknown User',
        avatar: null,
      };

  return {
    id: recordNode.id,
    parentId: recordNode.parentId,
    name: recordName ?? null,
    index: recordNode.index,
    attributes: recordNode.attributes,
    createdAt: new Date(recordNode.createdAt),
    createdBy: author,
    versionId: recordNode.versionId,
  };
};
