import { useWorkspace } from '@/contexts/workspace';
import { SelectNode, SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { mapNodeWithAttributes } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { RecordNode } from '@/types/databases';
import { User } from '@/types/users';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

const RECORDS_PER_PAGE = 50;

export const useRecordsQuery = (databaseId: string) => {
  const workspace = useWorkspace();

  return useInfiniteQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    RecordNode[],
    string[],
    number
  >({
    queryKey: ['records', databaseId],
    initialPageParam: 0,
    getNextPageParam: (lastPage: QueryResult<SelectNode>, pages) => {
      if (lastPage && lastPage.rows) {
        const recordsCount = lastPage.rows.filter(
          (row) => row.type === NodeTypes.Record,
        ).length;

        if (recordsCount >= RECORDS_PER_PAGE) {
          return pages.length;
        }
      }
      return undefined;
    },
    queryFn: async ({ queryKey, pageParam }) => {
      const offset = pageParam * RECORDS_PER_PAGE;
      const query = sql<SelectNodeWithAttributes>`
        WITH record_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id = ${databaseId} AND type = ${NodeTypes.Record}
          ORDER BY ${sql.ref('index')} ASC
          LIMIT ${sql.lit(RECORDS_PER_PAGE)}
          OFFSET ${sql.lit(offset)}
        ),
        author_nodes AS (
          SELECT *
          FROM nodes
          WHERE id IN (SELECT DISTINCT created_by FROM record_nodes)
        ),
        referenced_nodes AS (
          SELECT *
          FROM nodes
          WHERE id IN 
          (
            SELECT DISTINCT foreign_node_id 
            FROM node_attributes 
            WHERE node_id IN (SELECT id FROM record_nodes)
          )
        ),
        all_nodes as (
          SELECT * FROM record_nodes
          UNION ALL
          SELECT * FROM author_nodes
          UNION ALL
          SELECT * FROM referenced_nodes
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
        page: pageParam,
        query,
      });
    },
    select: (
      data: InfiniteData<QueryResult<SelectNodeWithAttributes>>,
    ): RecordNode[] => {
      const pages = data?.pages ?? [];
      const rows = pages.map((page) => page.rows).flat();
      return buildRecords(rows);
    },
  });
};

const buildRecords = (rows: SelectNodeWithAttributes[]): RecordNode[] => {
  const nodes = rows.map(mapNodeWithAttributes);
  const recordNodes = nodes.filter((node) => node.type === NodeTypes.Record);

  const authorNodes = nodes.filter((node) => node.type === NodeTypes.User);
  const records: RecordNode[] = [];
  const authorMap = new Map<string, User>();

  for (const author of authorNodes) {
    const name = author.attributes.find(
      (attr) => attr.type === AttributeTypes.Name,
    )?.textValue;

    const avatar = author.attributes.find(
      (attr) => attr.type === AttributeTypes.Avatar,
    )?.textValue;

    authorMap.set(author.id, {
      id: author.id,
      name: name ?? 'Unknown User',
      avatar,
    });
  }

  for (const node of recordNodes) {
    const name = node.attributes.find(
      (attr) => attr.type === AttributeTypes.Name,
    )?.textValue;

    const author = authorMap.get(node.createdBy);
    const record: RecordNode = {
      id: node.id,
      parentId: node.parentId,
      name: name ?? null,
      index: node.index,
      attributes: node.attributes,
      createdAt: new Date(node.createdAt),
      createdBy: author ?? {
        id: node.createdBy,
        name: 'Unknown User',
        avatar: null,
      },
      versionId: node.versionId,
    };

    records.push(record);
  }

  return records.sort((a, b) => compareString(a.index, b.index));
};
