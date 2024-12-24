import { SyncUserData, SyncUsersInput } from '@colanode/core';

import { BaseSynchronizer } from '@/main/synchronizers/base';
import { userService } from '@/main/services/user-service';

export class UserSynchronizer extends BaseSynchronizer<SyncUsersInput> {
  protected async process(data: SyncUserData): Promise<void> {
    await userService.syncServerUser(this.userId, data);
  }

  protected get cursorKey(): string {
    return `users`;
  }
}
