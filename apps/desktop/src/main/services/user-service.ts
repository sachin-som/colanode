import { SyncUserData, UserStatus } from '@colanode/core';

import { mapUser } from '@/main/utils';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';

class UserService {
  public async syncServerUser(userId: string, user: SyncUserData) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const createdUser = await workspaceDatabase
      .insertInto('users')
      .returningAll()
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        storage_limit: BigInt(user.storageLimit),
        max_file_size: BigInt(user.maxFileSize),
        version: BigInt(user.version),
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        status: UserStatus.Active,
        custom_name: user.customName,
        custom_avatar: user.customAvatar,
      })
      .onConflict((oc) =>
        oc
          .columns(['id'])
          .doUpdateSet({
            name: user.name,
            avatar: user.avatar,
            custom_name: user.customName,
            custom_avatar: user.customAvatar,
            role: user.role,
            storage_limit: BigInt(user.storageLimit),
            max_file_size: BigInt(user.maxFileSize),
            version: BigInt(user.version),
            updated_at: user.updatedAt,
          })
          .where('version', '<', BigInt(user.version))
      )
      .executeTakeFirst();

    await workspaceDatabase
      .deleteFrom('texts')
      .where('id', '=', user.id)
      .execute();

    await workspaceDatabase
      .insertInto('texts')
      .values({ id: user.id, name: user.name, text: null })
      .execute();

    if (createdUser) {
      eventBus.publish({
        type: 'user_created',
        userId: userId,
        user: mapUser(createdUser),
      });
    }
  }
}

export const userService = new UserService();
