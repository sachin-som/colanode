import { SyncUserData } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';

class UserService {
  public async syncServerUser(userId: string, user: SyncUserData) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('users')
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        version: BigInt(user.version),
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        status: 'active',
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
            version: BigInt(user.version),
            updated_at: user.updatedAt,
          })
          .where('version', '<', BigInt(user.version))
      )
      .execute();
  }
}

export const userService = new UserService();
