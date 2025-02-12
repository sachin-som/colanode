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
      `Applying server collaboration: ${collaboration.nodeId} for workspace ${this.workspace.id}`
    );

    await this.workspace.database
      .insertInto('collaborations')
      .values({
        node_id: collaboration.nodeId,
        role: collaboration.role,
        created_at: collaboration.createdAt,
        updated_at: collaboration.updatedAt,
        deleted_at: collaboration.deletedAt,
        revision: BigInt(collaboration.revision),
      })
      .onConflict((oc) =>
        oc
          .columns(['node_id'])
          .doUpdateSet({
            role: collaboration.role,
            revision: BigInt(collaboration.revision),
            updated_at: collaboration.updatedAt,
            deleted_at: collaboration.deletedAt,
          })
          .where('revision', '<', BigInt(collaboration.revision))
      )
      .execute();

    if (collaboration.deletedAt) {
      await this.workspace.database
        .deleteFrom('nodes')
        .where('root_id', '=', collaboration.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('node_interactions')
        .where('root_id', '=', collaboration.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('node_interactions')
        .where('root_id', '=', collaboration.nodeId)
        .execute();

      eventBus.publish({
        type: 'collaboration_deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        nodeId: collaboration.nodeId,
      });
    } else {
      eventBus.publish({
        type: 'collaboration_created',
        nodeId: collaboration.nodeId,
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
      });
    }
  }
}
