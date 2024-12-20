import {
  CollaborationsBatchMessage,
  InteractionsBatchMessage,
  SyncConsumerType,
  TransactionsBatchMessage,
  UsersBatchMessage,
} from '@colanode/core';

import { SyncConsumer } from '@/main/services/sync-consumer';
import { createDebugger } from '@/main/debugger';

class SyncService {
  private readonly debug = createDebugger('service:sync');
  private readonly consumers: Map<string, SyncConsumer> = new Map();

  public async initUserConsumers(accountId: string, userId: string) {
    await this.createConsumer(accountId, userId, 'transactions');
    await this.createConsumer(accountId, userId, 'collaborations');
    await this.createConsumer(accountId, userId, 'interactions');
    await this.createConsumer(accountId, userId, 'users');
  }

  public async deleteUserConsumers(userId: string) {
    this.consumers.forEach((consumer, key) => {
      if (consumer.userId === userId) {
        this.consumers.delete(key);
      }
    });
  }

  private async createConsumer(
    accountId: string,
    userId: string,
    type: SyncConsumerType
  ) {
    const key = this.getConsumerKey(userId, type);
    const consumer = this.consumers.get(key);
    if (consumer) {
      consumer.ping();
      return;
    }

    this.debug(
      `Creating new sync consumer for account ${accountId} and user ${userId} of type ${type}`
    );
    const newConsumer = new SyncConsumer(accountId, userId, type);
    this.consumers.set(key, newConsumer);

    await newConsumer.init();
  }

  public async syncServerTransactions(message: TransactionsBatchMessage) {
    const consumer = this.consumers.get(
      this.getConsumerKey(message.userId, 'transactions')
    );
    if (consumer) {
      consumer.syncTransactions(message);
    }
  }

  public async syncServerCollaborations(message: CollaborationsBatchMessage) {
    const consumer = this.consumers.get(
      this.getConsumerKey(message.userId, 'collaborations')
    );
    if (consumer) {
      consumer.syncCollaborations(message);
    }
  }

  public async syncServerInteractions(message: InteractionsBatchMessage) {
    const consumer = this.consumers.get(
      this.getConsumerKey(message.userId, 'interactions')
    );
    if (consumer) {
      consumer.syncInteractions(message);
    }
  }

  public async syncServerUsers(message: UsersBatchMessage) {
    const consumer = this.consumers.get(
      this.getConsumerKey(message.userId, 'users')
    );
    if (consumer) {
      consumer.syncUsers(message);
    }
  }

  private getConsumerKey(userId: string, type: SyncConsumerType) {
    return `${userId}-${type}`;
  }
}

export const syncService = new SyncService();
