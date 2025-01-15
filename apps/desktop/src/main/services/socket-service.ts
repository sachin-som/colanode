import { createDebugger, Message } from '@colanode/core';

import { SelectAccount } from '@/main/data/app/schema';
import { serverService } from '@/main/services/server-service';
import { SocketConnection } from '@/main/services/socket-connection';

class SocketService {
  private readonly debug = createDebugger('desktop:service:socket');
  private readonly sockets: Map<string, SocketConnection> = new Map();

  constructor() {}

  public sendMessage(accountId: string, message: Message): boolean {
    const connection = this.sockets.get(accountId);
    if (!connection) {
      return false;
    }

    return connection.sendMessage(message);
  }

  public checkConnection(account: SelectAccount) {
    const socket = this.sockets.get(account.id);
    if (socket) {
      socket.checkConnection();
      return;
    }

    const synapseUrl = serverService.buildSynapseUrl(account.server);
    const connection = new SocketConnection(synapseUrl, account);
    connection.init();

    this.sockets.set(account.id, connection);
  }

  public removeConnection(accountId: string) {
    const connection = this.sockets.get(accountId);
    if (connection) {
      connection.close();
      this.sockets.delete(accountId);
    }
  }

  public isConnected(accountId: string): boolean {
    const connection = this.sockets.get(accountId);
    return connection?.isConnected() ?? false;
  }
}

export const socketService = new SocketService();
