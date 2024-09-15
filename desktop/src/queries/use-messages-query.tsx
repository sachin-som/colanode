import { useWorkspace } from '@/contexts/workspace';
import { SelectNode, SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import {
  buildNodeWithAttributesAndChildren,
  mapNodeWithAttributes,
} from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MessageNode, MessageReactionCount } from '@/types/messages';
import { User } from '@/types/users';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

const MESSAGES_PER_PAGE = 50;

type MessageRow = SelectNodeWithAttributes & {
  reaction_counts: string | null;
  user_reactions: string | null;
};

export const useMessagesQuery = (conversationId: string) => {
  const workspace = useWorkspace();

  return useInfiniteQuery<
    QueryResult<MessageRow>,
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
      const query = sql<MessageRow>`
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
        ),
        node_attributes_aggregated AS (
            SELECT
                na.node_id,
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
                        'updated_by', na.'updated_by',
                        'version_id', na.'version_id',
                        'server_created_at', na.'server_created_at',
                        'server_updated_at', na.'server_updated_at',
                        'server_version_id', na.'server_version_id'
                    )
                ) AS attributes
            FROM node_attributes na
            WHERE na.node_id IN (SELECT id FROM all_nodes)
            GROUP BY na.node_id
        ),
        message_reaction_counts AS (
            SELECT
                mrc.node_id,
                json_group_array(
                    json_object(
                        'reaction', mrc.'reaction',
                        'count', mrc.'count'
                    )
                ) AS reaction_counts
            FROM (
                SELECT node_id, reaction, COUNT(*) as count
                FROM node_reactions
                WHERE node_id IN (SELECT id FROM message_nodes)
                GROUP BY node_id, reaction
            ) mrc
            GROUP BY mrc.node_id
        ),
        user_reactions AS (
            SELECT
                ur.node_id,
                json_group_array(ur.reaction) AS user_reactions
            FROM node_reactions ur
            WHERE ur.node_id IN (SELECT id FROM message_nodes) AND ur.reactor_id = ${workspace.userId}
            GROUP BY ur.node_id
        )
        SELECT
            n.*,
            COALESCE(na.attributes, json('[]')) AS attributes,
            COALESCE(mrc.reaction_counts, json('[]')) AS reaction_counts,
            COALESCE(ur.user_reactions, json('[]')) AS user_reactions
        FROM all_nodes n
        LEFT JOIN node_attributes_aggregated na ON n.id = na.node_id
        LEFT JOIN message_reaction_counts mrc ON n.id = mrc.node_id
        LEFT JOIN user_reactions ur ON n.id = ur.node_id;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        page: pageParam,
        query,
      });
    },
    select: (data: InfiniteData<QueryResult<MessageRow>>): MessageNode[] => {
      const pages = data?.pages ?? [];
      const rows = pages.map((page) => page.rows).flat();
      return buildMessages(rows);
    },
  });
};

const buildMessages = (rows: MessageRow[]): MessageNode[] => {
  const messageRows = rows.filter((row) => row.type === NodeTypes.Message);
  const authorRows = rows.filter((row) => row.type === NodeTypes.User);
  const contentNodes = rows
    .filter(
      (row) => row.type !== NodeTypes.User && row.type !== NodeTypes.Message,
    )
    .map(mapNodeWithAttributes);

  const messages: MessageNode[] = [];
  const authorMap = new Map<string, User>();
  for (const authorRow of authorRows) {
    const authorNode = mapNodeWithAttributes(authorRow);
    const name = authorNode.attributes.find(
      (attr) => attr.type === AttributeTypes.Name,
    )?.textValue;

    const avatar = authorNode.attributes.find(
      (attr) => attr.type === AttributeTypes.Avatar,
    )?.textValue;

    authorMap.set(authorRow.id, {
      id: authorRow.id,
      name: name ?? 'Unknown User',
      avatar,
    });
  }

  for (const messageRow of messageRows) {
    const messageNode = mapNodeWithAttributes(messageRow);
    const author = authorMap.get(messageNode.createdBy);
    const children = contentNodes
      .filter((n) => n.parentId === messageNode.id)
      .map((n) => buildNodeWithAttributesAndChildren(n, contentNodes));

    const reactionCounts: MessageReactionCount[] = JSON.parse(
      messageRow.reaction_counts,
    );
    const userReactions: string[] = JSON.parse(messageRow.user_reactions);

    const message: MessageNode = {
      id: messageNode.id,
      createdAt: messageNode.createdAt,
      author: author ?? {
        id: messageNode.createdBy,
        name: 'Unknown User',
        avatar: null,
      },
      content: children,
      reactionCounts,
      userReactions,
    };

    messages.push(message);
  }

  return messages.sort((a, b) => compareString(a.id, b.id));
};
