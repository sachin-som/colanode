import { SynchronizerInput, SynchronizerOutputMessage } from '@colanode/core';
import { Kysely } from 'kysely';

import { databaseService } from '@/main/data/database-service';
import { BaseSynchronizer } from '@/main/synchronizers/base';
import { createDebugger } from '@/main/debugger';
import { UserSynchronizer } from '@/main/synchronizers/users';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { CollaborationSynchronizer } from '@/main/synchronizers/collaborations';
import { TransactionSynchronizer } from '@/main/synchronizers/transactions';
import { MessageSynchronizer } from '@/main/synchronizers/messages';
import { MessageReactionSynchronizer } from '@/main/synchronizers/message-reactions';
import { FileSynchronizer } from '@/main/synchronizers/files';

class SyncService {
  private readonly debug = createDebugger('service:sync');
  private readonly synchronizers: Map<
    string,
    BaseSynchronizer<SynchronizerInput>
  > = new Map();

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

    if (input.type === 'transactions') {
      return new TransactionSynchronizer(
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
    await this.initSynchronizer(userId, accountId, workspaceDatabase, {
      type: 'transactions',
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
  }

  private removeRootNodeSynchronizers(userId: string, rootId: string) {
    const keys = Array.from(this.synchronizers.keys());

    for (const key of keys) {
      const synchronizer = this.synchronizers.get(key);
      if (!synchronizer) {
        continue;
      }

      if (
        synchronizer.input.type === 'transactions' &&
        synchronizer.input.rootId === rootId
      ) {
        this.synchronizers.delete(key);
      }

      if (
        synchronizer.input.type === 'messages' &&
        synchronizer.input.rootId === rootId
      ) {
        this.synchronizers.delete(key);
      }

      if (
        synchronizer.input.type === 'message_reactions' &&
        synchronizer.input.rootId === rootId
      ) {
        this.synchronizers.delete(key);
      }

      if (
        synchronizer.input.type === 'files' &&
        synchronizer.input.rootId === rootId
      ) {
        this.synchronizers.delete(key);
      }
    }
  }
}

export const syncService = new SyncService();
