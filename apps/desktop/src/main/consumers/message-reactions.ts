import { Kysely } from 'kysely';
import {
  MessageReactionsBatchMessage,
  ConsumeMessageReactionsMessage,
} from '@colanode/core';

import { messageService } from '@/main/services/message-service';
import { createDebugger } from '@/main/debugger';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { BaseConsumer } from '@/main/consumers/base';

export class MessageReactionsConsumer extends BaseConsumer {
  private readonly debug = createDebugger('consumer:message-reactions');
  private readonly rootId: string;

  constructor(
    userId: string,
    accountId: string,
    rootId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ) {
    super(userId, accountId, workspaceDatabase);
    this.rootId = rootId;
  }

  protected get cursorKey(): string {
    return `message-reactions:${this.rootId}`;
  }

  public async init() {
    await super.initCursor();
    this.requestMessageReactions();
  }

  public async processMessageReactions(message: MessageReactionsBatchMessage) {
    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server messages already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server messages for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const item of message.messageReactions) {
        await messageService.syncServerMessageReaction(message.userId, item);
        cursor = BigInt(item.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server messages for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server messages completed for user ${message.userId}`
      );

      if (cursor) {
        await this.setCursor(cursor);
      }

      this.status = 'idle';
      this.requestMessageReactions();
    }
  }

  private async requestMessageReactions() {
    const message: ConsumeMessageReactionsMessage = {
      type: 'consume_message_reactions',
      userId: this.userId,
      rootId: this.rootId,
      cursor: this.cursor.toString(),
    };

    this.sendMessage(message);
  }
}
