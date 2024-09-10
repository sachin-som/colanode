import { useWorkspace } from '@/contexts/workspace';
import { SelectNode, SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import {
  buildNodeWithAttributesAndChildren,
  mapNodeWithAttributes,
} from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MessageNode } from '@/types/messages';
import { User } from '@/types/users';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

const MESSAGES_PER_PAGE = 50;

export const useMessagesQuery = (conversationId: string) => {
  const workspace = useWorkspace();

  return useInfiniteQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    MessageNode[],
    string[],
    number
  >({
    queryKey: ['conversation', conversationId],
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: QueryResult<SelectNode>,
      pages,
    ): number | undefined => {
      if (lastPage && lastPage.rows) {
        const messageCount = lastPage.rows.filter(
          (row) => row.type === NodeTypes.Message,
        ).length;

        if (messageCount >= MESSAGES_PER_PAGE) {
          return pages.length;
        }
      }
      return undefined;
    },
    queryFn: async ({ queryKey, pageParam }) => {
      const offset = pageParam * MESSAGES_PER_PAGE;
      const query = sql<SelectNodeWithAttributes>`
          WITH message_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${conversationId} AND type = ${NodeTypes.Message}
            ORDER BY id DESC
            LIMIT ${sql.lit(MESSAGES_PER_PAGE)}
            OFFSET ${sql.lit(offset)}
          ),
          descendant_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN (SELECT id FROM message_nodes)
            UNION ALL
            SELECT child.*
            FROM nodes child
            INNER JOIN descendant_nodes parent ON child.parent_id = parent.id
          ),
          author_nodes AS (
            SELECT *
            FROM nodes
            WHERE id IN (SELECT DISTINCT created_by FROM message_nodes)
          ),
          all_nodes AS (
            SELECT * FROM message_nodes
            UNION ALL
            SELECT * FROM descendant_nodes
            UNION ALL
            SELECT * FROM author_nodes
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
    ): MessageNode[] => {
      const pages = data?.pages ?? [];
      const rows = pages.map((page) => page.rows).flat();
      return buildMessages(rows);
    },
  });
};

const buildMessages = (rows: SelectNodeWithAttributes[]): MessageNode[] => {
  const nodes = rows.map(mapNodeWithAttributes);
  const messageNodes = nodes.filter((node) => node.type === NodeTypes.Message);

  const authorNodes = nodes.filter((node) => node.type === NodeTypes.User);
  const messages: MessageNode[] = [];
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

  for (const node of messageNodes) {
    const author = authorMap.get(node.createdBy);
    const children = nodes
      .filter((n) => n.parentId === node.id)
      .map((n) => buildNodeWithAttributesAndChildren(n, nodes));

    const message: MessageNode = {
      id: node.id,
      createdAt: node.createdAt,
      author: author ?? {
        id: node.createdBy,
        name: 'Unknown User',
        avatar: null,
      },
      content: children,
    };

    messages.push(message);
  }

  return messages.sort((a, b) => compareString(a.id, b.id));
};
