import { WebSocket } from 'ws';
import {
  Message,
  WorkspaceStatus,
  ConsumeUsersMessage,
  ConsumeCollaborationsMessage,
  ConsumeTransactionsMessage,
  ConsumeInteractionsMessage,
} from '@colanode/core';

import { interactionService } from '@/services/interaction-service';
import { createLogger } from '@/lib/logger';
import { RequestAccount } from '@/types/api';
import { database } from '@/data/database';
import {
  AccountUpdatedEvent,
  Event,
  WorkspaceDeletedEvent,
  WorkspaceUpdatedEvent,
} from '@/types/events';
import { ConnectedUser } from '@/types/users';
import { UsersConsumer } from '@/consumers/users';
import { CollaborationsConsumer } from '@/consumers/collaborations';
import { TransactionsConsumer } from '@/consumers/transactions';
import { InteractionsConsumer } from '@/consumers/interactions';

type NodeConsumersWrapper = {
  transactions: TransactionsConsumer;
  interactions: InteractionsConsumer;
};

type ConsumersWrapper = {
  users: UsersConsumer;
  collaborations: CollaborationsConsumer;
  nodes: Map<string, NodeConsumersWrapper>;
};

type SocketUser = {
  user: ConnectedUser;
  consumers: ConsumersWrapper;
};

export class SocketConnection {
  private readonly logger = createLogger('socket-connection');
  private readonly account: RequestAccount;
  private readonly socket: WebSocket;

  private readonly users: Map<string, SocketUser> = new Map();
  private readonly pendingUsers: Map<string, Promise<SocketUser | null>> =
    new Map();

  constructor(account: RequestAccount, socket: WebSocket) {
    this.account = account;
    this.socket = socket;

    this.socket.on('message', (data) => {
      const message = JSON.parse(data.toString()) as Message;
      this.handleMessage(message);
    });
  }

  public getDeviceId() {
    return this.account.deviceId;
  }

  public getAccountId() {
    return this.account.id;
  }

  public sendMessage(message: Message) {
    this.socket.send(JSON.stringify(message));
  }

  public close() {
    this.socket.close();
  }

  public handleEvent(event: Event) {
    if (event.type === 'account_updated') {
      this.handleAccountUpdatedEvent(event);
    } else if (event.type === 'workspace_updated') {
      this.handleWorkspaceUpdatedEvent(event);
    } else if (event.type === 'workspace_deleted') {
      this.handleWorkspaceDeletedEvent(event);
    } else {
      for (const user of this.users.values()) {
        user.consumers.users.processEvent(event);
        user.consumers.collaborations.processEvent(event);
        for (const node of user.consumers.nodes.values()) {
          node.transactions.processEvent(event);
          node.interactions.processEvent(event);
        }
      }
    }
  }

  private async handleMessage(message: Message) {
    this.logger.trace(message, `Socket message from ${this.account.id}`);

    if (message.type === 'consume_users') {
      this.handleConsumeUsers(message);
    } else if (message.type === 'consume_collaborations') {
      this.handleConsumeCollaborations(message);
    } else if (message.type === 'consume_transactions') {
      this.handleConsumeTransactions(message);
    } else if (message.type === 'consume_interactions') {
      this.handleConsumeInteractions(message);
    } else if (message.type === 'sync_interactions') {
      interactionService.syncLocalInteractions(this.account.id, message);
    }
  }

  private async handleConsumeUsers(message: ConsumeUsersMessage) {
    this.logger.info(
      `Consume users from ${this.account.id} and user ${message.userId}`
    );

    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    await user.consumers.users.consume(message);
  }

  private async handleConsumeCollaborations(
    message: ConsumeCollaborationsMessage
  ) {
    this.logger.info(
      `Consume collaborations from ${this.account.id} and user ${message.userId}`
    );

    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    await user.consumers.collaborations.consume(message);
  }

  private async handleConsumeTransactions(message: ConsumeTransactionsMessage) {
    this.logger.info(
      `Consume transactions from ${this.account.id} and user ${message.userId}`
    );

    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    let nodeConsumers = user.consumers.nodes.get(message.rootId);
    if (!nodeConsumers) {
      nodeConsumers = {
        transactions: new TransactionsConsumer(user.user, message.rootId),
        interactions: new InteractionsConsumer(user.user, message.rootId),
      };

      user.consumers.nodes.set(message.rootId, nodeConsumers);
    }

    await nodeConsumers.transactions.consume(message);
  }

  private async handleConsumeInteractions(message: ConsumeInteractionsMessage) {
    this.logger.info(
      `Consume interactions from ${this.account.id} and user ${message.userId}`
    );

    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    let nodeConsumers = user.consumers.nodes.get(message.rootId);
    if (!nodeConsumers) {
      nodeConsumers = {
        transactions: new TransactionsConsumer(user.user, message.rootId),
        interactions: new InteractionsConsumer(user.user, message.rootId),
      };

      user.consumers.nodes.set(message.rootId, nodeConsumers);
    }

    await nodeConsumers.interactions.consume(message);
  }

  private async getOrCreateUser(userId: string): Promise<SocketUser | null> {
    const existingUser = this.users.get(userId);
    if (existingUser) {
      return existingUser;
    }

    const pendingUser = this.pendingUsers.get(userId);
    if (pendingUser) {
      return pendingUser;
    }

    const userPromise = this.fetchAndCreateUser(userId);
    this.pendingUsers.set(userId, userPromise);

    try {
      const user = await userPromise;
      return user;
    } finally {
      this.pendingUsers.delete(userId);
    }
  }

  private async fetchAndCreateUser(userId: string): Promise<SocketUser | null> {
    const user = await database
      .selectFrom('users')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirst();

    if (
      !user ||
      user.status !== WorkspaceStatus.Active ||
      user.account_id !== this.account.id
    ) {
      return null;
    }

    const addedSocketUser = this.users.get(userId);
    if (addedSocketUser) {
      return addedSocketUser;
    }

    // Create and store the new SocketUser
    const connectedUser: ConnectedUser = {
      userId: user.id,
      workspaceId: user.workspace_id,
      accountId: this.account.id,
      deviceId: this.account.deviceId,
      sendMessage: this.sendMessage.bind(this),
    };

    const usersConsumer = new UsersConsumer(connectedUser);
    const collaborationsConsumer = new CollaborationsConsumer(connectedUser);
    const nodesConsumers = new Map<string, NodeConsumersWrapper>();

    const newSocketUser: SocketUser = {
      user: connectedUser,
      consumers: {
        users: usersConsumer,
        collaborations: collaborationsConsumer,
        nodes: nodesConsumers,
      },
    };

    this.users.set(userId, newSocketUser);
    return newSocketUser;
  }

  private handleAccountUpdatedEvent(event: AccountUpdatedEvent) {
    if (event.accountId !== this.account.id) {
      return;
    }

    this.sendMessage({
      type: 'account_updated',
      accountId: this.account.id,
    });
  }

  private handleWorkspaceUpdatedEvent(event: WorkspaceUpdatedEvent) {
    const socketUsers = Array.from(this.users.values()).filter(
      (user) => user.user.workspaceId === event.workspaceId
    );

    if (socketUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_updated',
      workspaceId: event.workspaceId,
    });
  }

  private handleWorkspaceDeletedEvent(event: WorkspaceDeletedEvent) {
    const socketUsers = Array.from(this.users.values()).filter(
      (user) => user.user.workspaceId === event.workspaceId
    );

    if (socketUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_deleted',
      accountId: this.account.id,
    });
  }
}
