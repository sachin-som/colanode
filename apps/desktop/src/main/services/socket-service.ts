import { SocketConnection } from '@/main/services/socket-connection';
import { databaseService } from '@/main/data/database-service';
import { Message } from '@colanode/core';

const EVENT_LOOP_INTERVAL = 5000;

class SocketService {
  private readonly accounts: Map<string, SocketConnection> = new Map();
  private initiated: boolean = false;

  constructor() {
    this.executeEventLoop = this.executeEventLoop.bind(this);
  }

  public init() {
    if (this.initiated) {
      return;
    }

    // for the first time we execute event loop almost instantly
    setTimeout(this.executeEventLoop, 10);
    this.initiated = true;
  }

  public sendMessage(accountId: string, message: Message) {
    const connection = this.accounts.get(accountId);
    if (!connection) {
      return;
    }

    connection.sendMessage(message);
  }

  private async executeEventLoop() {
    await this.checkAccounts();
    this.checkConnections();

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async checkAccounts() {
    const servers = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .execute();

    const accounts = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('status', '=', 'active')
      .execute();

    // Update accounts map
    for (const account of accounts) {
      const server = servers.find((s) => s.domain === account.server);
      if (!server) {
        this.accounts.delete(account.id);
        continue;
      }

      if (this.accounts.has(account.id)) {
        continue;
      }

      const connection = new SocketConnection(server, account);
      connection.init();

      this.accounts.set(account.id, connection);
    }

    // Remove logged out or missing accounts
    for (const [accountId, connection] of this.accounts.entries()) {
      const account = accounts.find((acc) => acc.id === accountId);
      if (!account) {
        connection.close();
        this.accounts.delete(accountId);
      }
    }
  }

  private checkConnections() {
    for (const connection of this.accounts.values()) {
      connection.checkConnection();
    }
  }
}

export const socketService = new SocketService();
