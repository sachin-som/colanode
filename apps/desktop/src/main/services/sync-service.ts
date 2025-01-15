import {
  createDebugger,
  SynchronizerInput,
  SynchronizerOutputMessage,
} from '@colanode/core';
import { Kysely } from 'kysely';

import { databaseService } from '@/main/data/database-service';
import { BaseSynchronizer } from '@/main/synchronizers/base';
import { UserSynchronizer } from '@/main/synchronizers/users';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { CollaborationSynchronizer } from '@/main/synchronizers/collaborations';
import { EntryTransactionSynchronizer } from '@/main/synchronizers/entry-transactions';
import { MessageSynchronizer } from '@/main/synchronizers/messages';
import { MessageReactionSynchronizer } from '@/main/synchronizers/message-reactions';
import { FileSynchronizer } from '@/main/synchronizers/files';
import { EntryInteractionSynchronizer } from '@/main/synchronizers/entry-interactions';
import { FileInteractionSynchronizer } from '@/main/synchronizers/file-interactions';
import { MessageInteractionSynchronizer } from '@/main/synchronizers/message-interactions';
import { FileTombstoneSynchronizer } from '@/main/synchronizers/file-tombstones';
import { MessageTombstoneSynchronizer } from '@/main/synchronizers/message-tombstones';
import { eventBus } from '@/shared/lib/event-bus';

class SyncService {
  private readonly debug = createDebugger('desktop:service:sync');
  private readonly synchronizers: Map<
    string,
    BaseSynchronizer<SynchronizerInput>
  > = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'workspace_deleted') {
        this.removeWorkspaceSynchronizers(event.workspace.userId);
      } else if (event.type === 'account_deleted') {
        this.removeAccountSynchronizers(event.account.id);
      } else if (event.type === 'collaboration_deleted') {
        this.removeRootNodeSynchronizers(event.userId, event.entryId);
      }
    });
  }

  public async initSynchronizers(userId: string) {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      return;
    }

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await this.initSynchronizer(
      userId,
      workspace.account_id,
      workspaceDatabase,
      {
        type: 'users',
      }
    );

    await this.initSynchronizer(
      userId,
      workspace.account_id,
      workspaceDatabase,
      {
        type: 'collaborations',
      }
    );

    const collaborations = await workspaceDatabase
      .selectFrom('collaborations')
      .selectAll()
      .execute();

    for (const collaboration of collaborations) {
      const rootId = collaboration.entry_id;
      if (collaboration.deleted_at) {
        this.removeRootNodeSynchronizers(userId, rootId);
      } else {
        await this.initRootNodeSynchronizers(
          userId,
          workspace.account_id,
          rootId,
          workspaceDatabase
        );
      }
    }
  }

  public processSyncMessage(
    message: SynchronizerOutputMessage<SynchronizerInput>
  ) {
    const synchronizer = this.synchronizers.get(message.id);
    if (!synchronizer) {
      return;
    }

    synchronizer.sync(message);
  }

  private async initSynchronizer(
    userId: string,
    accountId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>,
    input: SynchronizerInput
  ) {
    this.debug('Initializing synchronizer', input);
    const synchronizer = this.buildSynchronizer(
      userId,
      accountId,
      workspaceDatabase,
      input
    );

    if (!synchronizer) {
      return;
    }

    const existingSynchronizer = this.synchronizers.get(synchronizer.id);
    if (existingSynchronizer) {
      this.debug(
        'Synchronizer already exists, pinging',
        existingSynchronizer.id
      );
      existingSynchronizer.ping();
      return;
    }

    this.synchronizers.set(synchronizer.id, synchronizer);
    await synchronizer.init();
  }

  private buildSynchronizer(
    userId: string,
    accountId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>,
    input: SynchronizerInput
  ): BaseSynchronizer<SynchronizerInput> | null {
    if (input.type === 'users') {
      return new UserSynchronizer(userId, accountId, input, workspaceDatabase);
    }

    if (input.type === 'collaborations') {
      return new CollaborationSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'files') {
      return new FileSynchronizer(userId, accountId, input, workspaceDatabase);
    }

    if (input.type === 'messages') {
      return new MessageSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'message_reactions') {
      return new MessageReactionSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'entry_transactions') {
      return new EntryTransactionSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'entry_interactions') {
      return new EntryInteractionSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'file_interactions') {
      return new FileInteractionSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'message_interactions') {
      return new MessageInteractionSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'file_tombstones') {
      return new FileTombstoneSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    if (input.type === 'message_tombstones') {
      return new MessageTombstoneSynchronizer(
        userId,
        accountId,
        input,
        workspaceDatabase
      );
    }

    return null;
  }

  private async initRootNodeSynchronizers(
    userId: string,
    accountId: string,
    rootId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ) {
    this.debug('Initializing root node synchronizers', rootId);

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'entry_transactions',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'messages',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'message_reactions',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'files',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'entry_interactions',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'file_interactions',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'message_interactions',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'file_tombstones',
      rootId,
    });

    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'message_tombstones',
      rootId,
    });
  }

  private async removeRootNodeSynchronizers(userId: string, rootId: string) {
    this.debug('Removing root node synchronizers', rootId);

    const keys = Array.from(this.synchronizers.keys());

    for (const key of keys) {
      const synchronizer = this.synchronizers.get(key);
      if (!synchronizer) {
        continue;
      }

      if (synchronizer.userId !== userId) {
        continue;
      }

      if (!this.isRootNodeSynchronizer(synchronizer, rootId)) {
        continue;
      }

      await synchronizer.delete();
      this.synchronizers.delete(key);

      this.debug('Removed root node synchronizer', userId, synchronizer.input);
    }
  }

  private async removeWorkspaceSynchronizers(userId: string) {
    const keys = Array.from(this.synchronizers.keys());

    for (const key of keys) {
      const synchronizer = this.synchronizers.get(key);
      if (!synchronizer) {
        continue;
      }

      if (synchronizer.userId === userId) {
        await synchronizer.delete();
        this.synchronizers.delete(key);

        this.debug(
          'Removed workspace synchronizer',
          userId,
          synchronizer.input
        );
      }
    }
  }

  private async removeAccountSynchronizers(accountId: string) {
    const keys = Array.from(this.synchronizers.keys());

    for (const key of keys) {
      const synchronizer = this.synchronizers.get(key);
      if (!synchronizer) {
        continue;
      }

      if (synchronizer.accountId === accountId) {
        await synchronizer.delete();
        this.synchronizers.delete(key);

        this.debug(
          'Removed account synchronizer',
          accountId,
          synchronizer.input
        );
      }
    }
  }

  private isRootNodeSynchronizer(
    synchronizer: BaseSynchronizer<SynchronizerInput>,
    rootId: string
  ) {
    if (
      synchronizer.input.type === 'entry_transactions' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'entry_interactions' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'messages' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'message_reactions' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'message_interactions' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'message_tombstones' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'files' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'file_interactions' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    if (
      synchronizer.input.type === 'file_tombstones' &&
      synchronizer.input.rootId === rootId
    ) {
      return true;
    }

    return false;
  }
}

export const syncService = new SyncService();
