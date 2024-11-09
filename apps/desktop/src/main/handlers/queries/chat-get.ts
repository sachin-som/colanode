import { ChatGetQueryInput } from '@/operations/queries/chat-get';
import { databaseManager } from '@/main/data/database-manager';
import { mapNode } from '@/main/utils';
import { SelectNode } from '@/main/data/workspace/schema';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';
import { ChatNode } from '@/types/chats';

export class ChatGetQueryHandler implements QueryHandler<ChatGetQueryInput> {
  async handleQuery(
    input: ChatGetQueryInput
  ): Promise<QueryResult<ChatGetQueryInput>> {
    const chat = await this.fetchChat(input);
    if (!chat) {
      return {
        output: null,
        state: {},
      };
    }

    const collaborators = await this.fetchCollaborators(input, chat);
    return {
      output: this.buildChat(chat, collaborators),
      state: {
        chat,
        collaborators,
      },
    };
  }

  async checkForChanges(
    changes: MutationChange[],
    input: ChatGetQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<ChatGetQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const chat = await this.fetchChat(input);
    if (!chat) {
      return {
        hasChanges: true,
        result: {
          output: null,
          state: {},
        },
      };
    }

    const collaborators = await this.fetchCollaborators(input, chat);

    if (
      isEqual(chat, state.chat) &&
      isEqual(collaborators, state.collaborators)
    ) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildChat(chat, collaborators),
        state: {
          chat,
          collaborators,
        },
      },
    };
  }

  private async fetchChat(
    input: ChatGetQueryInput
  ): Promise<SelectNode | null> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const chat = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', input.chatId)
      .selectAll()
      .executeTakeFirst();

    return chat ?? null;
  }

  private async fetchCollaborators(
    input: ChatGetQueryInput,
    chat: SelectNode
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    if (!chat.attributes) {
      return [];
    }

    const attributes = JSON.parse(chat.attributes);
    if (!attributes.collaborators) {
      return [];
    }

    const collaboratorIds: string[] = [];
    if (attributes.collaborators) {
      for (const collaboratorId of Object.keys(attributes.collaborators)) {
        if (collaboratorId === input.userId) {
          continue;
        }

        if (collaboratorIds.includes(collaboratorId)) {
          continue;
        }

        collaboratorIds.push(collaboratorId);
      }
    }

    const collaborators = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', 'in', collaboratorIds)
      .selectAll()
      .execute();

    return collaborators;
  }

  private buildChat = (
    chat: SelectNode,
    collaborators: SelectNode[]
  ): ChatNode | null => {
    const collaborator = mapNode(collaborators[0]);
    if (collaborator.attributes.type !== 'user') {
      return null;
    }

    return {
      id: chat.id,
      name: collaborator.attributes.name ?? 'Unknown',
      avatar: collaborator.attributes.avatar ?? null,
    };
  };
}
