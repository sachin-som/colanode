import { ConsumeUsersMessage, UsersBatchMessage } from '@colanode/core';

import { userService } from '@/main/services/user-service';
import { BaseConsumer } from '@/main/consumers/base';
import { createDebugger } from '@/main/debugger';

export class UsersConsumer extends BaseConsumer {
  private readonly debug = createDebugger('consumer:users');

  protected get cursorKey(): string {
    return 'users';
  }

  public async init() {
    await super.initCursor();
    this.requestUsers();
  }

  public async processUsers(message: UsersBatchMessage) {
    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const user of message.users) {
        await userService.syncServerUser(message.userId, user);
        cursor = BigInt(user.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server users for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server users completed for user ${message.userId}`
      );

      if (cursor) {
        await this.setCursor(cursor);
      }

      this.status = 'idle';
      this.requestUsers();
    }
  }

  private async requestUsers() {
    const message: ConsumeUsersMessage = {
      type: 'consume_users',
      userId: this.userId,
      cursor: this.cursor.toString(),
    };

    this.sendMessage(message);
  }
}
