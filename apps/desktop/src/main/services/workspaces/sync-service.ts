import {
  createDebugger,
  SyncCollaborationsInput,
  SyncUsersInput,
  SyncNodesInput,
  SyncNodeInteractionsInput,
  SyncNodeReactionsInput,
  SyncFilesInput,
  SyncNodeTombstonesInput,
  SyncNodeInteractionData,
  SyncNodeReactionData,
  SyncNodeTombstoneData,
  SyncNodeData,
  SyncUserData,
  SyncCollaborationData,
  SyncFileData,
  SyncDocumentUpdatesInput,
  SyncDocumentUpdateData,
} from '@colanode/core';

import { Event } from '@/shared/types/events';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { Synchronizer } from '@/main/services/workspaces/synchronizer';
import { eventBus } from '@/shared/lib/event-bus';

interface RootSynchronizers {
  nodes: Synchronizer<SyncNodesInput>;
  nodeInteractions: Synchronizer<SyncNodeInteractionsInput>;
  nodeReactions: Synchronizer<SyncNodeReactionsInput>;
  nodeTombstones: Synchronizer<SyncNodeTombstonesInput>;
  files: Synchronizer<SyncFilesInput>;
  documentUpdates: Synchronizer<SyncDocumentUpdatesInput>;
}

type SyncHandlers = {
  users: (data: SyncUserData) => Promise<void>;
  collaborations: (data: SyncCollaborationData) => Promise<void>;
  nodes: (data: SyncNodeData) => Promise<void>;
  nodeInteractions: (data: SyncNodeInteractionData) => Promise<void>;
  nodeReactions: (data: SyncNodeReactionData) => Promise<void>;
  nodeTombstones: (data: SyncNodeTombstoneData) => Promise<void>;
  files: (data: SyncFileData) => Promise<void>;
  documentUpdates: (data: SyncDocumentUpdateData) => Promise<void>;
};

export class SyncService {
  private readonly debug = createDebugger('desktop:service:sync');
  private readonly workspace: WorkspaceService;

  private readonly rootSynchronizers: Map<string, RootSynchronizers> =
    new Map();

  private readonly syncHandlers: SyncHandlers;

  private userSynchronizer: Synchronizer<SyncUsersInput> | undefined;
  private collaborationSynchronizer:
    | Synchronizer<SyncCollaborationsInput>
    | undefined;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
    this.syncHandlers = {
      users: this.workspace.users.syncServerUser.bind(this.workspace.users),
      collaborations:
        this.workspace.collaborations.syncServerCollaboration.bind(
          this.workspace.collaborations
        ),
      nodes: this.workspace.nodes.syncServerNode.bind(this.workspace.nodes),
      nodeInteractions:
        this.workspace.nodeInteractions.syncServerNodeInteraction.bind(
          this.workspace.nodes
        ),
      nodeReactions: this.workspace.nodeReactions.syncServerNodeReaction.bind(
        this.workspace.nodes
      ),
      nodeTombstones: this.workspace.nodes.syncServerNodeDelete.bind(
        this.workspace.nodes
      ),
      files: this.workspace.files.syncServerFile.bind(this.workspace.files),
      documentUpdates: this.workspace.documents.syncServerDocumentUpdate.bind(
        this.workspace.documents
      ),
    };
    eventBus.subscribe(this.handleEvent.bind(this));
  }

  private handleEvent(event: Event): void {
    if (
      event.type === 'collaboration_created' &&
      event.accountId === this.workspace.accountId &&
      event.workspaceId === this.workspace.id
    ) {
      this.initRootSynchronizers(event.nodeId);
    } else if (
      event.type === 'collaboration_deleted' &&
      event.accountId === this.workspace.accountId &&
      event.workspaceId === this.workspace.id
    ) {
      this.removeRootSynchronizers(event.nodeId);
    }
  }

  public async init() {
    this.debug(`Initializing sync service for workspace ${this.workspace.id}`);

    if (!this.userSynchronizer) {
      this.userSynchronizer = new Synchronizer(
        this.workspace,
        { type: 'users' },
        'users',
        this.syncHandlers.users
      );

      await this.userSynchronizer.init();
    }

    if (!this.collaborationSynchronizer) {
      this.collaborationSynchronizer = new Synchronizer(
        this.workspace,
        { type: 'collaborations' },
        'collaborations',
        this.syncHandlers.collaborations
      );

      await this.collaborationSynchronizer.init();
    }

    const collaborations = await this.workspace.database
      .selectFrom('collaborations')
      .selectAll()
      .execute();

    for (const collaboration of collaborations) {
      await this.initRootSynchronizers(collaboration.node_id);
    }
  }

  public destroy(): void {
    this.userSynchronizer?.destroy();
    this.collaborationSynchronizer?.destroy();

    for (const rootSynchronizers of this.rootSynchronizers.values()) {
      this.destroyRootSynchronizers(rootSynchronizers);
    }
  }

  private destroyRootSynchronizers(rootSynchronizers: RootSynchronizers): void {
    rootSynchronizers.nodes.destroy();
    rootSynchronizers.nodeInteractions.destroy();
    rootSynchronizers.nodeReactions.destroy();
    rootSynchronizers.nodeTombstones.destroy();
    rootSynchronizers.files.destroy();
    rootSynchronizers.documentUpdates.destroy();
  }

  private async initRootSynchronizers(rootId: string): Promise<void> {
    if (this.rootSynchronizers.has(rootId)) {
      return;
    }

    this.debug(
      `Initializing root synchronizers for root ${rootId} in workspace ${this.workspace.id}`
    );

    const rootSynchronizers = {
      nodes: new Synchronizer(
        this.workspace,
        { type: 'nodes', rootId },
        `${rootId}_nodes`,
        this.syncHandlers.nodes
      ),
      nodeInteractions: new Synchronizer(
        this.workspace,
        { type: 'node_interactions', rootId },
        `${rootId}_node_interactions`,
        this.syncHandlers.nodeInteractions
      ),
      nodeReactions: new Synchronizer(
        this.workspace,
        { type: 'node_reactions', rootId },
        `${rootId}_node_reactions`,
        this.syncHandlers.nodeReactions
      ),
      nodeTombstones: new Synchronizer(
        this.workspace,
        { type: 'node_tombstones', rootId },
        `${rootId}_node_tombstones`,
        this.syncHandlers.nodeTombstones
      ),
      files: new Synchronizer(
        this.workspace,
        { type: 'files', rootId },
        `${rootId}_files`,
        this.syncHandlers.files
      ),
      documentUpdates: new Synchronizer(
        this.workspace,
        { type: 'document_updates', rootId },
        `${rootId}_document_updates`,
        this.syncHandlers.documentUpdates
      ),
    };

    this.rootSynchronizers.set(rootId, rootSynchronizers);
    await Promise.all(
      Object.values(rootSynchronizers).map((synchronizer) =>
        synchronizer.init()
      )
    );
  }

  private removeRootSynchronizers(rootId: string): void {
    const rootSynchronizers = this.rootSynchronizers.get(rootId);
    if (!rootSynchronizers) {
      return;
    }

    this.destroyRootSynchronizers(rootSynchronizers);
    this.rootSynchronizers.delete(rootId);
  }
}
