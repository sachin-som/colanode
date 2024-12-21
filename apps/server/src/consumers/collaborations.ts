import {
  CollaborationsBatchMessage,
  ConsumeCollaborationsMessage,
} from '@colanode/core';

import { BaseConsumer } from '@/consumers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { mapCollaboration } from '@/lib/nodes';

export class CollaborationsConsumer extends BaseConsumer {
  public processEvent(event: Event): void {
    if (
      event.type === 'collaboration_created' &&
      event.collaboratorId === this.user.userId
    ) {
      this.fetchCollaborations();
    } else if (
      event.type === 'collaboration_updated' &&
      event.collaboratorId === this.user.userId
    ) {
      this.fetchCollaborations();
    }
  }

  public async consume(message: ConsumeCollaborationsMessage) {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = BigInt(message.cursor);
    if (this.status === 'idle') {
      this.cursor = cursor;
      this.status = 'pending';
      await this.fetchCollaborations();
    } else if (this.status === 'pending' && this.cursor !== cursor) {
      this.cursor = cursor;
      await this.fetchCollaborations();
    }
  }

  private async fetchCollaborations() {
    if (this.cursor === null) {
      return;
    }

    if (this.status !== 'pending') {
      return;
    }

    this.status = 'fetching';
    const unsyncedCollaborations = await database
      .selectFrom('collaborations')
      .selectAll()
      .where('workspace_id', '=', this.user.workspaceId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedCollaborations.length === 0) {
      this.status = 'pending';
      return;
    }

    const collaborations = unsyncedCollaborations.map(mapCollaboration);
    const message: CollaborationsBatchMessage = {
      type: 'collaborations_batch',
      userId: this.user.userId,
      collaborations,
    };

    this.status = 'idle';
    this.user.sendMessage(message);
  }
}
