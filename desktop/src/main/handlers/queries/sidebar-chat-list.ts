import { SidebarChatListQueryInput } from '@/operations/queries/sidebar-chat-list';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@/lib/constants';
import { SidebarChatNode } from '@/types/workspaces';
import { mapNode } from '@/lib/nodes';
import { MutationChange } from '@/operations/mutations';
import { isEqual } from 'lodash';

export class SidebarChatListQueryHandler
  implements QueryHandler<SidebarChatListQueryInput>
{
  public async handleQuery(
    input: SidebarChatListQueryInput,
  ): Promise<QueryResult<SidebarChatListQueryInput>> {
    const chats = await this.fetchChats(input);
    const collaborators = await this.fetchChatCollaborators(input, chats);

    return {
      output: this.buildSidebarChatNodes(input.userId, chats, collaborators),
      state: {
        chats,
        collaborators,
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
          change.table === 'nodes' &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const chats = await this.fetchChats(input);
    const collaborators = await this.fetchChatCollaborators(input, chats);
    if (
      isEqual(chats, state.chats) &&
      isEqual(collaborators, state.collaborators)
    ) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildSidebarChatNodes(input.userId, chats, collaborators),
        state: {
          chats,
          collaborators,
        },
      },
    };
  }

  private async fetchChats(
    input: SidebarChatListQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const chats = await workspaceDatabase
      .selectFrom('nodes')
      .where('type', '=', NodeTypes.Chat)
      .selectAll()
      .execute();

    return chats;
  }

  private async fetchChatCollaborators(
    input: SidebarChatListQueryInput,
    chats: SelectNode[],
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const collaboratorIds: string[] = [];
    for (const chat of chats) {
      if (!chat.attributes) {
        continue;
      }

      const attributes = JSON.parse(chat.attributes);
      if (!attributes.collaborators) {
        continue;
      }

      const keys = Object.keys(attributes.collaborators);
      for (const key of keys) {
        if (key === input.userId) {
          continue;
        }

        collaboratorIds.push(key);
      }
    }

    const collaborators = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', 'in', collaboratorIds)
      .selectAll()
      .execute();

    return collaborators;
  }

  private buildSidebarChatNodes = (
    userId: string,
    chats: SelectNode[],
    collaborators: SelectNode[],
  ): SidebarChatNode[] => {
    const sidebarChatNodes: SidebarChatNode[] = [];

    for (const chat of chats) {
      const chatNode = mapNode(chat);
      if (!chatNode.attributes || !chatNode.attributes.collaborators) {
        continue;
      }

      const collaboratorIds = Object.keys(chatNode.attributes.collaborators);
      if (!collaboratorIds || collaboratorIds.length === 0) {
        continue;
      }

      const collaboratorId = collaboratorIds.find((id) => id !== userId);

      if (!collaboratorId) {
        continue;
      }

      const collaboratorRow = collaborators.find(
        (r) => r.id === collaboratorId,
      );

      if (!collaboratorRow) {
        continue;
      }

      const collaboratorNode = mapNode(collaboratorRow);
      sidebarChatNodes.push({
        id: chatNode.id,
        type: chatNode.type,
        name: collaboratorNode.attributes.name ?? 'Unknown',
        avatar: collaboratorNode.attributes.avatar ?? null,
      });
    }

    return sidebarChatNodes;
  };
}
