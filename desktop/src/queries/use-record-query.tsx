import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { RecordNode } from '@/types/databases';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useRecordQuery = (recordId: string) => {
  const workspace = useWorkspace();

  return useQuery<QueryResult<SelectNode>, Error, RecordNode | null, string[]>({
    queryKey: ['record', recordId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
          WITH record_node AS (
          SELECT *
          FROM nodes
          WHERE id = ${recordId}
        ),
        author_node AS (
          SELECT *
          FROM nodes
          WHERE id IN (SELECT DISTINCT created_by FROM record_node)
        )
        SELECT * FROM record_node
        UNION ALL
        SELECT * FROM author_node
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNode>): RecordNode | null => {
      const rows = data?.rows ?? [];
      return buildRecord(recordId, rows);
    },
  });
};

const buildRecord = (
  recordId: string,
  rows: SelectNode[],
): RecordNode | null => {
  const nodes = rows.map(mapNode);
  const recordNode = nodes.find((node) => node.id === recordId);
  if (!recordNode) {
    return null;
  }

  const recordName = recordNode.attributes.name;
  const authorNode = nodes.find((node) => node.type === NodeTypes.User);
  const author = authorNode
    ? {
        id: authorNode.id,
        name: authorNode.attributes.name,
        avatar: authorNode.attributes.avatar,
        email: authorNode.attributes.email,
      }
    : {
        id: recordNode.createdBy,
        name: 'Unknown User',
        avatar: null,
        email: 'unknown@neuron.com',
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
