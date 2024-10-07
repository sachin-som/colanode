import { ChatGetQueryInput } from '@/operations/queries/chat-get';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';
import { mapNode } from '@/lib/nodes';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { MutationChange } from '@/operations/mutations';
import { isEqual } from 'lodash';
import { ChatNode } from '@/types/chats';

export class ChatGetQueryHandler implements QueryHandler<ChatGetQueryInput> {
  async handleQuery(
    input: ChatGetQueryInput,
  ): Promise<QueryResult<ChatGetQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildChat(input.chatId, rows),
      state: {
        rows,
      },
    };
  }

  async checkForChanges(
    changes: MutationChange[],
    input: ChatGetQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<ChatGetQueryInput>> {
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

    const rows = await this.fetchNodes(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildChat(input.chatId, rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(input: ChatGetQueryInput): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<SelectNode>`
      WITH chat_node AS (
        SELECT *
        FROM nodes
        WHERE id = ${input.chatId}
      ),
      collaborator_nodes AS (
        SELECT *
        FROM nodes
        WHERE id IN 
        (
          SELECT DISTINCT collaborator_id 
          FROM node_collaborators 
          WHERE node_id = ${input.chatId} AND collaborator_id != ${input.userId}
        )
      )
      SELECT * FROM chat_node
      UNION ALL
      SELECT * FROM collaborator_nodes
      `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildChat = (chatId: string, rows: SelectNode[]): ChatNode | null => {
    const nodes = rows.map(mapNode);
    const chatNode = nodes.find((node) => node.id === chatId);
    if (!chatNode) {
      return null;
    }

    const collaborators = rows.filter((node) => node.id !== chatId);
    if (collaborators.length === 0) {
      return null;
    }

    const collaborator = mapNode(collaborators[0]);
    return {
      id: chatNode.id,
      name: collaborator.attributes.name ?? 'Unknown',
      avatar: collaborator.attributes.avatar ?? null,
    };
  };
}
