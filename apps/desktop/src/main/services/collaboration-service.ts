import { SyncCollaborationData } from '@colanode/core';

import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';

class CollaborationService {
  private readonly debug = createDebugger('service:collaboration');

  public async syncServerCollaboration(
    userId: string,
    collaboration: SyncCollaborationData
  ) {
    this.debug(
      `Applying server collaboration: ${collaboration.entryId} for user ${userId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('collaborations')
      .values({
        entry_id: collaboration.entryId,
        role: collaboration.role,
        created_at: collaboration.createdAt,
        updated_at: collaboration.updatedAt,
        deleted_at: collaboration.deletedAt,
        version: BigInt(collaboration.version),
      })
      .onConflict((oc) =>
        oc
          .columns(['entry_id'])
          .doUpdateSet({
            role: collaboration.role,
            version: BigInt(collaboration.version),
            updated_at: collaboration.updatedAt,
            deleted_at: collaboration.deletedAt,
          })
          .where('version', '<', BigInt(collaboration.version))
      )
      .execute();

    if (collaboration.deletedAt) {
      await workspaceDatabase.transaction().execute(async (tx) => {
        await tx
          .deleteFrom('entries')
          .where('id', '=', collaboration.entryId)
          .execute();

        await tx
          .deleteFrom('entry_transactions')
          .where('entry_id', '=', collaboration.entryId)
          .execute();
      });

      eventBus.publish({
        type: 'collaboration_deleted',
        userId,
        entryId: collaboration.entryId,
      });
    } else {
      eventBus.publish({
        type: 'collaboration_created',
        userId,
        entryId: collaboration.entryId,
      });
    }
  }
}

export const collaborationService = new CollaborationService();
