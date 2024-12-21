import { Kysely } from 'kysely';
import {
  ConsumeInteractionsMessage,
  InteractionsBatchMessage,
} from '@colanode/core';

import { interactionService } from '@/main/services/interaction-service';
import { createDebugger } from '@/main/debugger';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { BaseConsumer } from '@/main/consumers/base';

export class InteractionsConsumer extends BaseConsumer {
  private readonly debug = createDebugger('consumer:interactions');
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
    return `interactions:${this.rootId}`;
  }

  public async init() {
    await super.initCursor();
    this.requestInteractions();
  }

  public async processInteractions(message: InteractionsBatchMessage) {
    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server interactions already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server interactions for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const interaction of message.interactions) {
        await interactionService.applyServerInteraction(
          message.userId,
          interaction
        );
        cursor = BigInt(interaction.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server interactions for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server interactions completed for user ${message.userId}`
      );

      if (cursor) {
        await this.setCursor(cursor);
      }

      this.status = 'idle';
      this.requestInteractions();
    }
  }

  private async requestInteractions() {
    const message: ConsumeInteractionsMessage = {
      type: 'consume_interactions',
      userId: this.userId,
      rootId: this.rootId,
      cursor: this.cursor.toString(),
    };

    this.sendMessage(message);
  }
}
