import {
  createDebugger,
  SyncCollaborationsInput,
  SyncUsersInput,
  SyncEntryTransactionsInput,
  SyncEntryInteractionsInput,
  SyncMessagesInput,
  SyncMessageInteractionsInput,
  SyncMessageReactionsInput,
  SyncFilesInput,
  SyncFileInteractionsInput,
  SyncFileTombstonesInput,
  SyncMessageTombstonesInput,
  SyncEntryTransactionData,
  SyncMessageTombstoneData,
  SyncMessageInteractionData,
  SyncEntryInteractionData,
  SyncMessageData,
  SyncMessageReactionData,
  SyncFileInteractionData,
  SyncFileTombstoneData,
  SyncFileData,
  SyncUserData,
  SyncCollaborationData,
} from '@colanode/core';

import { Event } from '@/shared/types/events';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { Synchronizer } from '@/main/services/workspaces/synchronizer';
import { eventBus } from '@/shared/lib/event-bus';

interface RootSynchronizers {
  entryTransactions: Synchronizer<SyncEntryTransactionsInput>;
  entryInteractions: Synchronizer<SyncEntryInteractionsInput>;
  messages: Synchronizer<SyncMessagesInput>;
  messageInteractions: Synchronizer<SyncMessageInteractionsInput>;
  messageReactions: Synchronizer<SyncMessageReactionsInput>;
  messageTombstones: Synchronizer<SyncMessageTombstonesInput>;
  files: Synchronizer<SyncFilesInput>;
  fileInteractions: Synchronizer<SyncFileInteractionsInput>;
  fileTombstones: Synchronizer<SyncFileTombstonesInput>;
}

type SyncHandlers = {
  users: (data: SyncUserData) => Promise<void>;
  collaborations: (data: SyncCollaborationData) => Promise<void>;
  entry_transactions: (data: SyncEntryTransactionData) => Promise<void>;
  entry_interactions: (data: SyncEntryInteractionData) => Promise<void>;
  messages: (data: SyncMessageData) => Promise<void>;
  message_interactions: (data: SyncMessageInteractionData) => Promise<void>;
  message_reactions: (data: SyncMessageReactionData) => Promise<void>;
  message_tombstones: (data: SyncMessageTombstoneData) => Promise<void>;
  files: (data: SyncFileData) => Promise<void>;
  file_interactions: (data: SyncFileInteractionData) => Promise<void>;
  file_tombstones: (data: SyncFileTombstoneData) => Promise<void>;
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
      entry_transactions: this.workspace.entries.applyServerTransaction.bind(
        this.workspace.entries
      ),
      entry_interactions:
        this.workspace.entries.syncServerEntryInteraction.bind(
          this.workspace.entries
        ),
      messages: this.workspace.messages.syncServerMessage.bind(
        this.workspace.messages
      ),
      message_interactions:
        this.workspace.messages.syncServerMessageInteraction.bind(
          this.workspace.messages
        ),
      message_reactions: this.workspace.messages.syncServerMessageReaction.bind(
        this.workspace.messages
      ),
      message_tombstones:
        this.workspace.messages.syncServerMessageTombstone.bind(
          this.workspace.messages
        ),
      files: this.workspace.files.syncServerFile.bind(this.workspace.files),
      file_interactions: this.workspace.files.syncServerFileInteraction.bind(
        this.workspace.files
      ),
      file_tombstones: this.workspace.files.syncServerFileTombstone.bind(
        this.workspace.files
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
      this.initRootSynchronizers(event.entryId);
    } else if (
      event.type === 'collaboration_deleted' &&
      event.accountId === this.workspace.accountId &&
      event.workspaceId === this.workspace.id
    ) {
      this.removeRootSynchronizers(event.entryId);
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
      await this.initRootSynchronizers(collaboration.entry_id);
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
    rootSynchronizers.entryTransactions.destroy();
    rootSynchronizers.entryInteractions.destroy();
    rootSynchronizers.messages.destroy();
    rootSynchronizers.messageInteractions.destroy();
    rootSynchronizers.messageReactions.destroy();
    rootSynchronizers.messageTombstones.destroy();
    rootSynchronizers.files.destroy();
    rootSynchronizers.fileInteractions.destroy();
    rootSynchronizers.fileTombstones.destroy();
  }

  private async initRootSynchronizers(rootId: string): Promise<void> {
    if (this.rootSynchronizers.has(rootId)) {
      return;
    }

    this.debug(
      `Initializing root synchronizers for root ${rootId} in workspace ${this.workspace.id}`
    );

    const rootSynchronizers = {
      entryTransactions: new Synchronizer(
        this.workspace,
        { type: 'entry_transactions', rootId },
        `${rootId}_entry_transactions`,
        this.syncHandlers.entry_transactions
      ),
      entryInteractions: new Synchronizer(
        this.workspace,
        { type: 'entry_interactions', rootId },
        `${rootId}_entry_interactions`,
        this.syncHandlers.entry_interactions
      ),
      messages: new Synchronizer(
        this.workspace,
        { type: 'messages', rootId },
        `${rootId}_messages`,
        this.syncHandlers.messages
      ),
      messageInteractions: new Synchronizer(
        this.workspace,
        { type: 'message_interactions', rootId },
        `${rootId}_message_interactions`,
        this.syncHandlers.message_interactions
      ),
      messageReactions: new Synchronizer(
        this.workspace,
        { type: 'message_reactions', rootId },
        `${rootId}_message_reactions`,
        this.syncHandlers.message_reactions
      ),
      messageTombstones: new Synchronizer(
        this.workspace,
        { type: 'message_tombstones', rootId },
        `${rootId}_message_tombstones`,
        this.syncHandlers.message_tombstones
      ),
      files: new Synchronizer(
        this.workspace,
        { type: 'files', rootId },
        `${rootId}_files`,
        this.syncHandlers.files
      ),
      fileInteractions: new Synchronizer(
        this.workspace,
        { type: 'file_interactions', rootId },
        `${rootId}_file_interactions`,
        this.syncHandlers.file_interactions
      ),
      fileTombstones: new Synchronizer(
        this.workspace,
        { type: 'file_tombstones', rootId },
        `${rootId}_file_tombstones`,
        this.syncHandlers.file_tombstones
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
