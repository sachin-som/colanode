import { ConsumeUsersMessage, UsersBatchMessage } from '@colanode/core';

import { BaseConsumer } from '@/consumers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { mapUser } from '@/lib/nodes';

export class UsersConsumer extends BaseConsumer {
  public processEvent(event: Event): void {
    if (
      event.type === 'user_created' &&
      event.workspaceId === this.user.workspaceId
    ) {
      this.fetchUsers();
    } else if (
      event.type === 'user_updated' &&
      event.workspaceId === this.user.workspaceId
    ) {
      this.fetchUsers();
    }
  }

  public async consume(message: ConsumeUsersMessage) {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = BigInt(message.cursor);
    if (this.status === 'idle') {
      this.cursor = cursor;
      this.status = 'pending';
      await this.fetchUsers();
    } else if (this.status === 'pending' && this.cursor !== cursor) {
      this.cursor = cursor;
      await this.fetchUsers();
    }
  }

  private async fetchUsers() {
    if (this.cursor === null) {
      return;
    }

    if (this.status !== 'pending') {
      return;
    }

    this.status = 'fetching';
    const unsyncedUsers = await database
      .selectFrom('users')
      .selectAll()
      .where('workspace_id', '=', this.user.workspaceId)
      .where('version', '>', this.cursor)
      .orderBy('version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedUsers.length === 0) {
      this.status = 'pending';
      return;
    }

    const users = unsyncedUsers.map(mapUser);
    const message: UsersBatchMessage = {
      type: 'users_batch',
      userId: this.user.userId,
      users,
    };

    this.status = 'idle';
    this.user.sendMessage(message);
  }
}
