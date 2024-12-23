import { Kysely } from 'kysely';
import { ConsumeMessagesMessage, MessagesBatchMessage } from '@colanode/core';

import { messageService } from '@/main/services/message-service';
import { createDebugger } from '@/main/debugger';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { BaseConsumer } from '@/main/consumers/base';

export class MessagesConsumer extends BaseConsumer {
  private readonly debug = createDebugger('consumer:messages');
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
    return `messages:${this.rootId}`;
  }

  public async init() {
    await super.initCursor();
    this.requestMessages();
  }

  public async processMessages(message: MessagesBatchMessage) {
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
      for (const item of message.messages) {
        await messageService.syncServerMessage(message.userId, item);
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
      this.requestMessages();
    }
  }

  private async requestMessages() {
    const message: ConsumeMessagesMessage = {
      type: 'consume_messages',
      userId: this.userId,
      rootId: this.rootId,
      cursor: this.cursor.toString(),
    };

    this.sendMessage(message);
  }
}
