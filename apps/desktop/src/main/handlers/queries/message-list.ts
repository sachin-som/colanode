import { MessageListQueryInput } from '@/operations/queries/message-list';
import { databaseManager } from '@/main/data/database-manager';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@colanode/core';
import {
  MessageNode,
  MessageReactionCount,
  MessageAuthor,
} from '@/types/messages';
import { mapNode } from '@/main/utils';
import { compareString } from '@/lib/utils';
import { isEqual } from 'lodash-es';
import { mapBlocksToContents } from '@/lib/editor';

export class MessageListQueryHandler
  implements QueryHandler<MessageListQueryInput>
{
  public async handleQuery(
    input: MessageListQueryInput
  ): Promise<QueryResult<MessageListQueryInput>> {
    const messages = await this.fetchMesssages(input);
    const authors = await this.fetchAuthors(input, messages);

    return {
      output: this.buildMessages(input.userId, messages, authors),
      state: {
        messages,
        authors,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: MessageListQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<MessageListQueryInput>> {
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

    const messages = await this.fetchMesssages(input);
    const authors = await this.fetchAuthors(input, messages);

    if (isEqual(messages, state.messages) && isEqual(authors, state.authors)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildMessages(input.userId, messages, authors),
        state: {
          messages,
          authors,
        },
      },
    };
  }

  private async fetchMesssages(
    input: MessageListQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const offset = (input.page - 1) * input.count;
    const messages = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.conversationId),
          eb('type', '=', NodeTypes.Message),
        ])
      )
      .orderBy('id', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return messages;
  }

  private async fetchAuthors(
    input: MessageListQueryInput,
    messages: SelectNode[]
  ): Promise<SelectNode[]> {
    if (messages.length === 0) {
      return [];
    }

    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const authorIds = messages.map((message) => message.created_by);
    const authors = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', 'in', authorIds)
      .execute();

    return authors;
  }

  private buildMessages = (
    userId: string,
    messageRows: SelectNode[],
    authorRows: SelectNode[]
  ): MessageNode[] => {
    const messages: MessageNode[] = [];
    const authorMap = new Map<string, MessageAuthor>();
    for (const authorRow of authorRows) {
      const authorNode = mapNode(authorRow);
      if (authorNode.type !== 'user') {
        continue;
      }

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
      if (messageNode.type !== 'message') {
        continue;
      }

      const author = authorMap.get(messageNode.createdBy);
      const reactions =
        (messageNode.attributes.reactions as Record<string, string[]>) ?? {};

      const reactionCounts: MessageReactionCount[] = Object.entries(reactions)
        .map(([reaction, users]) => ({
          reaction,
          count: users.length,
          isReactedTo: users.includes(userId),
        }))
        .filter((reactionCount) => reactionCount.count > 0);

      const message: MessageNode = {
        id: messageNode.id,
        versionId: messageNode.versionId,
        createdAt: messageNode.createdAt,
        author: author ?? {
          id: messageNode.createdBy,
          name: 'Unknown User',
          email: 'unknown@colanode.com',
          avatar: null,
        },
        content: mapBlocksToContents(
          messageNode.id,
          Object.values(messageNode.attributes.content ?? {})
        ),
        reactionCounts,
      };

      messages.push(message);
    }

    return messages.sort((a, b) => compareString(a.id, b.id));
  };
}
