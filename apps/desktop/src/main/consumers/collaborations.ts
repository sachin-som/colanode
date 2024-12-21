import {
  CollaborationsBatchMessage,
  ConsumeCollaborationsMessage,
} from '@colanode/core';

import { collaborationService } from '@/main/services/collaboration-service';
import { BaseConsumer } from '@/main/consumers/base';
import { createDebugger } from '@/main/debugger';

export class CollaborationsConsumer extends BaseConsumer {
  private readonly debug = createDebugger('consumer:collaborations');

  protected get cursorKey(): string {
    return 'collaborations';
  }

  public async init() {
    await super.initCursor();
    this.requestCollaborations();
  }

  public async processCollaborations(message: CollaborationsBatchMessage) {
    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server collaborations already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server collaborators for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const collaboration of message.collaborations) {
        await collaborationService.syncServerCollaboration(
          message.userId,
          collaboration
        );
        cursor = BigInt(collaboration.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server collaborators for user ${message.userId}`
      );
    } finally {
      if (cursor) {
        await this.setCursor(cursor);
      }

      this.status = 'idle';
      this.requestCollaborations();
    }
  }

  private async requestCollaborations() {
    const message: ConsumeCollaborationsMessage = {
      type: 'consume_collaborations',
      userId: this.userId,
      cursor: this.cursor.toString(),
    };

    this.sendMessage(message);
  }
}
