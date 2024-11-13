import { MessageListQueryInput } from '@/shared/queries/message-list';
import { databaseService } from '@/main/data/database-service';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { SelectNode } from '@/main/data/workspace/schema';
import { MessageAttributes, NodeTypes } from '@colanode/core';
import {
  MessageNode,
  MessageReactionCount,
  MessageAuthor,
} from '@/shared/types/messages';
import { mapNode } from '@/main/utils';
import { compareString } from '@/shared/lib/utils';
import { mapBlocksToContents } from '@/shared/lib/editor';
import { Event } from '@/shared/types/events';

export class MessageListQueryHandler
  implements QueryHandler<MessageListQueryInput>
{
  public async handleQuery(
    input: MessageListQueryInput
  ): Promise<MessageNode[]> {
    const messages = await this.fetchMesssages(input);
    const authors = await this.fetchAuthors(input, messages);

    return this.buildMessages(input.userId, messages, authors);
  }

  public async checkForChanges(
    event: Event,
    input: MessageListQueryInput,
    output: MessageNode[]
  ): Promise<ChangeCheckResult<MessageListQueryInput>> {
    if (
      event.type === 'node_created' &&
      event.userId === input.userId &&
      event.node.type === 'message' &&
      event.node.parentId === input.conversationId
    ) {
      const messages = await this.fetchMesssages(input);
      const authors = await this.fetchAuthors(input, messages);

      return {
        hasChanges: true,
        result: this.buildMessages(input.userId, messages, authors),
      };
    }

    if (event.type === 'node_updated' && event.userId === input.userId) {
      if (
        event.node.type === 'message' &&
        event.node.parentId === input.conversationId
      ) {
        const message = output.find((message) => message.id === event.node.id);
        if (message) {
          message.content = mapBlocksToContents(
            event.node.id,
            Object.values(event.node.attributes.content ?? {})
          );

          message.reactionCounts = this.buildReactionCounts(
            event.node.attributes,
            input.userId
          );

          message.createdAt = event.node.createdAt;
          message.versionId = event.node.versionId;

          return {
            hasChanges: true,
            result: output,
          };
        }
      }

      if (event.node.type === 'user') {
        let hasChanges = false;
        for (const message of output) {
          if (message.author.id === event.node.id) {
            message.author.name = event.node.attributes.name;
            message.author.email = event.node.attributes.email;
            message.author.avatar = event.node.attributes.avatar;

            hasChanges = true;
          }
        }

        if (hasChanges) {
          return {
            hasChanges: true,
            result: output,
          };
        }
      }
    }

    if (event.type === 'node_deleted' && event.userId === input.userId) {
      if (
        event.node.type === 'message' &&
        event.node.parentId === input.conversationId
      ) {
        const message = output.find((message) => message.id === event.node.id);

        if (message) {
          const newOutput = await this.handleQuery(input);
          return {
            hasChanges: true,
            result: newOutput,
          };
        }
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchMesssages(
    input: MessageListQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
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

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
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
      const reactionCounts = this.buildReactionCounts(
        messageNode.attributes,
        userId
      );

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

  private buildReactionCounts(
    attributes: MessageAttributes,
    userId: string
  ): MessageReactionCount[] {
    const reactions = attributes.reactions as Record<string, string[]>;
    return Object.entries(reactions)
      .map(([reaction, users]) => ({
        reaction,
        count: users.length,
        isReactedTo: users.includes(userId),
      }))
      .filter((reactionCount) => reactionCount.count > 0);
  }
}
