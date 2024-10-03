import { MessageListQueryInput } from '@/types/queries/message-list';
import { databaseContext } from '@/main/data/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { MutationChange } from '@/types/mutations';
import { SelectNode } from '@/main/data/workspace/schema';
import { sql } from 'kysely';
import { NodeTypes } from '@/lib/constants';
import { MessageNode, MessageReactionCount } from '@/types/messages';
import { buildNodeWithChildren, mapNode } from '@/lib/nodes';
import { UserNode } from '@/types/users';
import { compareString } from '@/lib/utils';
import { isEqual } from 'lodash';

type MessageRow = SelectNode & {
  reaction_counts: string | null;
  user_reactions: string | null;
};

export class MessageListQueryHandler
  implements QueryHandler<MessageListQueryInput>
{
  public async handleQuery(
    input: MessageListQueryInput,
  ): Promise<QueryResult<MessageListQueryInput>> {
    const rows = await this.fetchMesssages(input);

    return {
      output: this.buildMessages(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: MessageListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<MessageListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          (change.table === 'nodes' || change.table === 'node_reactions') &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchMesssages(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildMessages(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchMesssages(
    input: MessageListQueryInput,
  ): Promise<MessageRow[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const offset = input.page * input.count;
    const query = sql<MessageRow>`
      WITH message_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id = ${input.conversationId} AND type = ${NodeTypes.Message}
          ORDER BY id DESC
          LIMIT ${sql.lit(input.count)}
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
          WHERE ur.node_id IN (SELECT id FROM message_nodes) AND ur.actor_id = ${input.userId}
          GROUP BY ur.node_id
      )
      SELECT
          n.*,
          COALESCE(mrc.reaction_counts, json('[]')) AS reaction_counts,
          COALESCE(ur.user_reactions, json('[]')) AS user_reactions
      FROM all_nodes n
      LEFT JOIN message_reaction_counts mrc ON n.id = mrc.node_id
      LEFT JOIN user_reactions ur ON n.id = ur.node_id;
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildMessages = (rows: MessageRow[]): MessageNode[] => {
    const messageRows = rows.filter((row) => row.type === NodeTypes.Message);
    const authorRows = rows.filter((row) => row.type === NodeTypes.User);
    const contentNodes = rows
      .filter(
        (row) => row.type !== NodeTypes.User && row.type !== NodeTypes.Message,
      )
      .map(mapNode);

    const messages: MessageNode[] = [];
    const authorMap = new Map<string, UserNode>();
    for (const authorRow of authorRows) {
      const authorNode = mapNode(authorRow);
      const name = authorNode.attributes.name;
      const email = authorNode.attributes.email;
      const avatar = authorNode.attributes.avatar;

      authorMap.set(authorRow.id, {
        id: authorRow.id,
        name: name ?? 'Unknown User',
        email,
        avatar,
      });
    }

    for (const messageRow of messageRows) {
      const messageNode = mapNode(messageRow);
      const author = authorMap.get(messageNode.createdBy);
      const children = contentNodes
        .filter((n) => n.parentId === messageNode.id)
        .map((n) => buildNodeWithChildren(n, contentNodes));

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
          email: 'unknown@neuron.com',
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
}
