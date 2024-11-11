import { SidebarChatListQueryInput } from '@/operations/queries/sidebar-chat-list';
import { databaseManager } from '@/main/data/database-manager';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@colanode/core';
import { SidebarChatNode } from '@/types/workspaces';
import { mapNode } from '@/main/utils';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';

interface UnreadCountRow {
  node_id: string;
  unread_count: number;
  mentions_count: number;
}

export class SidebarChatListQueryHandler
  implements QueryHandler<SidebarChatListQueryInput>
{
  public async handleQuery(
    input: SidebarChatListQueryInput
  ): Promise<QueryResult<SidebarChatListQueryInput>> {
    const chats = await this.fetchChats(input);
    const collaborators = await this.fetchChatCollaborators(input, chats);
    const unreadCounts = await this.fetchUnreadCounts(input, chats);

    return {
      output: this.buildSidebarChatNodes(
        input.userId,
        chats,
        collaborators,
        unreadCounts
      ),
      state: {
        chats,
        collaborators,
        unreadCounts,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: SidebarChatListQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<SidebarChatListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          (change.table === 'nodes' || change.table === 'user_nodes') &&
          change.userId === input.userId
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const chats = await this.fetchChats(input);
    const collaborators = await this.fetchChatCollaborators(input, chats);
    const unreadCounts = await this.fetchUnreadCounts(input, chats);

    if (
      isEqual(chats, state.chats) &&
      isEqual(collaborators, state.collaborators) &&
      isEqual(unreadCounts, state.unreadCounts)
    ) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildSidebarChatNodes(
          input.userId,
          chats,
          collaborators,
          unreadCounts
        ),
        state: {
          chats,
          collaborators,
          unreadCounts,
        },
      },
    };
  }

  private async fetchChats(
    input: SidebarChatListQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
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
    chats: SelectNode[]
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
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

  private async fetchUnreadCounts(
    input: SidebarChatListQueryInput,
    chats: SelectNode[]
  ): Promise<UnreadCountRow[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const chatIds = chats.map((chat) => chat.id);
    const unreadCounts = await workspaceDatabase
      .selectFrom('user_nodes as un')
      .innerJoin('nodes as n', 'un.node_id', 'n.id')
      .where('un.user_id', '=', input.userId)
      .where('n.type', '=', NodeTypes.Message)
      .where('n.parent_id', 'in', chatIds)
      .where('un.last_seen_version_id', 'is', null)
      .select(['n.parent_id as node_id'])
      .select((eb) => [
        eb.fn.count<number>('un.node_id').as('unread_count'),
        eb.fn.sum<number>('un.mentions_count').as('mentions_count'),
      ])
      .groupBy('n.parent_id')
      .execute();

    return unreadCounts;
  }

  private buildSidebarChatNodes = (
    userId: string,
    chats: SelectNode[],
    collaborators: SelectNode[],
    unreadCounts: UnreadCountRow[]
  ): SidebarChatNode[] => {
    const sidebarChatNodes: SidebarChatNode[] = [];

    for (const chat of chats) {
      const chatNode = mapNode(chat);
      if (chatNode.type !== 'chat') {
        continue;
      }

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
        (r) => r.id === collaboratorId
      );

      if (!collaboratorRow) {
        continue;
      }

      const collaboratorNode = mapNode(collaboratorRow);
      if (collaboratorNode.type !== 'user') {
        continue;
      }

      const unreadCountRow = unreadCounts.find((r) => r.node_id === chat.id);

      sidebarChatNodes.push({
        id: chatNode.id,
        type: chatNode.type,
        name: collaboratorNode.attributes.name ?? 'Unknown',
        avatar: collaboratorNode.attributes.avatar ?? null,
        unreadCount: unreadCountRow?.unread_count ?? 0,
        mentionsCount: unreadCountRow?.mentions_count ?? 0,
      });
    }

    return sidebarChatNodes;
  };
}
