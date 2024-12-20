import {
  CollaborationsBatchMessage,
  DeletedCollaborationsBatchMessage,
  InitSyncConsumerMessage,
  InteractionsBatchMessage,
  SyncConsumerType,
  TransactionsBatchMessage,
  UsersBatchMessage,
} from '@colanode/core';

import { userService } from './user-service';

import { interactionService } from '@/main/services/interaction-service';
import { nodeService } from '@/main/services/node-service';
import { collaborationService } from '@/main/services/collaboration-service';
import { socketService } from '@/main/services/socket-service';
import { fetchCursor, updateCursor } from '@/main/utils';
import { createDebugger } from '@/main/debugger';

type SyncConsumerStatus = 'idle' | 'fetching' | 'syncing';

export class SyncConsumer {
  private readonly debug = createDebugger('service:sync-consumer');
  public readonly accountId: string;
  public readonly userId: string;
  public readonly type: SyncConsumerType;

  private cursor: bigint | null = null;
  private status: SyncConsumerStatus = 'idle';

  constructor(accountId: string, userId: string, type: SyncConsumerType) {
    this.accountId = accountId;
    this.userId = userId;
    this.type = type;
  }

  public async init() {
    if (this.status === 'fetching') {
      return;
    }

    const cursor = await fetchCursor(this.userId, this.type);
    this.initConsumer(cursor);
  }

  public async ping() {
    if (this.status === 'idle' || this.cursor === null) {
      await this.init();
      return;
    }

    if (this.status === 'syncing') {
      return;
    }

    const cursor = await fetchCursor(this.userId, this.type);
    if (cursor !== this.cursor) {
      this.cursor = cursor;
      this.initConsumer(cursor);
    }
  }

  public async syncTransactions(message: TransactionsBatchMessage) {
    if (this.type !== 'transactions') {
      this.debug(
        `Syncing of server transactions not supported for consumer type ${this.type}, skipping`
      );
      return;
    }

    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server transactions already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server transactions for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const transaction of message.transactions) {
        await nodeService.applyServerTransaction(message.userId, transaction);
        cursor = BigInt(transaction.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server transactions for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server transactions completed for user ${message.userId}`
      );

      if (cursor) {
        this.cursor = cursor;
        this.initConsumer(cursor);
        await updateCursor(message.userId, 'transactions', cursor);
        this.status = 'idle';
      } else {
        this.status = 'idle';
        this.ping();
      }
    }
  }

  public async syncCollaborations(message: CollaborationsBatchMessage) {
    if (this.type !== 'collaborations') {
      this.debug(
        `Syncing of server collaborations not supported for consumer type ${this.type}, skipping`
      );
      return;
    }

    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server collaborations already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server collaborations for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const collaboration of message.collaborations) {
        await collaborationService.applyServerCollaboration(
          message.userId,
          collaboration
        );
        cursor = BigInt(collaboration.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server collaborations for user ${message.userId}`
      );
    } finally {
      if (cursor) {
        await updateCursor(message.userId, 'collaborations', cursor);
        this.cursor = cursor;
        this.status = 'idle';
        this.initConsumer(cursor);
      } else {
        this.status = 'idle';
        this.ping();
      }
    }
  }

  public async syncDeletedCollaborations(
    message: DeletedCollaborationsBatchMessage
  ) {
    if (this.type !== 'deleted_collaborations') {
      this.debug(
        `Syncing of server deleted collaborations not supported for consumer type ${this.type}, skipping`
      );
      return;
    }

    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server deleted collaborations already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(
      `Syncing server deleted collaborations for user ${message.userId}`
    );

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const deletedCollaboration of message.deletedCollaborations) {
        await collaborationService.applyServerDeletedCollaboration(
          message.userId,
          deletedCollaboration
        );
        cursor = BigInt(deletedCollaboration.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server deleted collaborations for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server deleted collaborations completed for user ${message.userId}`
      );

      if (cursor) {
        await updateCursor(message.userId, 'deleted_collaborations', cursor);
        this.cursor = cursor;
        this.status = 'idle';
        this.initConsumer(cursor);
      } else {
        this.status = 'idle';
        this.ping();
      }
    }
  }

  public async syncInteractions(message: InteractionsBatchMessage) {
    if (this.type !== 'interactions') {
      this.debug(
        `Syncing of server interactions not supported for consumer type ${this.type}, skipping`
      );
      return;
    }

    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server interactions already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server interactions for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const interaction of message.interactions) {
        await interactionService.applyServerInteraction(
          message.userId,
          interaction
        );
        cursor = BigInt(interaction.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server interactions for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server interactions completed for user ${message.userId}`
      );

      if (cursor) {
        await updateCursor(message.userId, 'interactions', cursor);
        this.cursor = cursor;
        this.status = 'idle';
        this.initConsumer(cursor);
      } else {
        this.status = 'idle';
        this.ping();
      }
    }
  }

  public async syncUsers(message: UsersBatchMessage) {
    if (this.type !== 'users') {
      this.debug(
        `Syncing of server users not supported for consumer type ${this.type}, skipping`
      );
      return;
    }

    this.debug(`Syncing server users for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const user of message.users) {
        await userService.syncServerUser(message.userId, user);
        cursor = BigInt(user.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server users for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server users completed for user ${message.userId}`
      );

      if (cursor) {
        await updateCursor(message.userId, 'users', cursor);
        this.cursor = cursor;
        this.status = 'idle';
        this.initConsumer(cursor);
      } else {
        this.status = 'idle';
        this.ping();
      }
    }
  }

  private initConsumer(cursor: bigint) {
    const message: InitSyncConsumerMessage = {
      type: 'init_sync_consumer',
      userId: this.userId,
      consumerType: this.type,
      cursor: cursor.toString(),
    };

    const sent = socketService.sendMessage(this.accountId, message);
    if (sent) {
      this.status = 'fetching';
    }
  }
}
