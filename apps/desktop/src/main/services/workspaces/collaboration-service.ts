import { SyncCollaborationData, createDebugger } from '@colanode/core';

import { eventBus } from '@/shared/lib/event-bus';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';

export class CollaborationService {
  private readonly debug = createDebugger('desktop:service:collaboration');
  private readonly workspace: WorkspaceService;

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
  }

  public async syncServerCollaboration(collaboration: SyncCollaborationData) {
    this.debug(
      `Applying server collaboration: ${collaboration.entryId} for workspace ${this.workspace.id}`
    );

    await this.workspace.database
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
      await this.workspace.database
        .deleteFrom('entries')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      await this.workspace.database
        .deleteFrom('entry_transactions')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      await this.workspace.database
        .deleteFrom('entry_interactions')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      await this.workspace.database
        .deleteFrom('messages')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      await this.workspace.database
        .deleteFrom('message_reactions')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      await this.workspace.database
        .deleteFrom('message_interactions')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      await this.workspace.database
        .deleteFrom('files')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      await this.workspace.database
        .deleteFrom('file_interactions')
        .where('root_id', '=', collaboration.entryId)
        .execute();

      eventBus.publish({
        type: 'collaboration_deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        entryId: collaboration.entryId,
      });
    } else {
      eventBus.publish({
        type: 'collaboration_created',
        entryId: collaboration.entryId,
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
      });
    }
  }
}
