import { SidebarChatListQueryInput } from '@/operations/queries/sidebar-chat-list';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@/lib/constants';
import { SidebarChatNode } from '@/types/workspaces';
import { mapNode } from '@/lib/nodes';
import { MutationChange } from '@/operations/mutations';
import { isEqual } from 'lodash';

type ChatRow = SelectNode & {
  collaborators: string;
};

export class SidebarChatListQueryHandler
  implements QueryHandler<SidebarChatListQueryInput>
{
  public async handleQuery(
    input: SidebarChatListQueryInput,
  ): Promise<QueryResult<SidebarChatListQueryInput>> {
    const rows = await this.fetchChats(input);
    return {
      output: this.buildSidebarChatNodes(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: SidebarChatListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<SidebarChatListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          (change.table === 'nodes' || change.table === 'node_collaborators') &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchChats(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildSidebarChatNodes(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchChats(
    input: SidebarChatListQueryInput,
  ): Promise<ChatRow[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<ChatRow>`
        WITH chat_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id IS NULL AND type = ${NodeTypes.Chat}
        ),
        collaborator_nodes AS (
          SELECT *
          FROM nodes
          WHERE id IN
          (
            SELECT collaborator_id
            FROM node_collaborators
            WHERE collaborator_id != ${input.userId}
              AND node_id IN 
              (
                SELECT id
                FROM chat_nodes
              )
          )
        ),
        all_nodes AS (
          SELECT * FROM chat_nodes
          UNION ALL
          SELECT * FROM collaborator_nodes
        ),
        chat_collaborators AS (
          SELECT
              nc.node_id,
              json_group_array(nc.collaborator_id) AS collaborators
          FROM node_collaborators nc
          WHERE nc.node_id IN (SELECT id FROM chat_nodes)
            AND nc.collaborator_id != ${input.userId}
          GROUP BY nc.node_id
        )
        SELECT
          n.*,
            COALESCE(cc.collaborators, json('[]')) AS collaborators
        FROM all_nodes n
        LEFT JOIN chat_collaborators cc ON n.id = cc.node_id
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildSidebarChatNodes = (rows: ChatRow[]): SidebarChatNode[] => {
    const chats: SidebarChatNode[] = [];

    for (const row of rows) {
      if (row.type !== NodeTypes.Chat) {
        continue;
      }

      const chatNode = mapNode(row);
      const collaboratorIds = JSON.parse(row.collaborators) as string[];
      if (!collaboratorIds || collaboratorIds.length === 0) {
        continue;
      }

      const collaboratorId = collaboratorIds[0];
      const collaboratorRow = rows.find((r) => r.id === collaboratorId);
      if (!collaboratorRow) {
        continue;
      }

      const collaboratorNode = mapNode(collaboratorRow);
      chats.push({
        id: chatNode.id,
        type: chatNode.type,
        name: collaboratorNode.attributes.name,
        avatar: chatNode.attributes.avatar,
      });
    }

    return chats;
  };
}
