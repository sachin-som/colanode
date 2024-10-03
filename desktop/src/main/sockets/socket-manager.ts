import { SocketConnection } from '@/main/sockets/socket-connection';
import { mediator } from '@/main/mediator';

const EVENT_LOOP_INTERVAL = 5000;

class SocketManager {
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

  private async executeEventLoop() {
    await this.checkAccounts();
    this.checkConnections();

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async checkAccounts() {
    const servers = await mediator.executeQuery({
      type: 'server_list',
    });

    const accounts = await mediator.executeQuery({
      type: 'account_list',
    });

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

export const socketManager = new SocketManager();
