import { WebSocketServer, WebSocket } from 'ws';
import { createDebugger } from '@colanode/core';

import { IncomingMessage, Server } from 'http';

import { rateLimitService } from '@/services/rate-limit-service';
import { SocketConnection } from '@/services/socket-connection';
import { eventBus } from '@/lib/event-bus';
import { parseToken, verifyToken } from '@/lib/tokens';
import { RequestAccount } from '@/types/api';

class SocketService {
  private readonly debug = createDebugger('server:service:socket');
  private readonly connections: Map<string, SocketConnection> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'device_deleted') {
        const connection = this.connections.get(event.deviceId);
        if (connection) {
          connection.close();
          this.connections.delete(event.deviceId);
          return;
        }
      }

      for (const connection of this.connections.values()) {
        connection.handleEvent(event);
      }
    });
  }

  public async init(server: Server) {
    this.debug('Initializing socket service');

    const wss = new WebSocketServer({
      noServer: true,
    });

    server.on('upgrade', async (request, socket, head) => {
      this.debug(
        `Upgrade request, url: ${request.url}, device: ${request.headers['device-id']}`
      );

      if (request.url !== '/client/v1/synapse') {
        this.debug(`Invalid upgrade request ${request.url}`);
        socket.destroy();
        return;
      }

      const token = request.headers['authorization'];
      if (!token) {
        this.debug(`Invalid upgrade request, no token`);
        socket.destroy();
        return;
      }

      const tokenData = parseToken(token);
      if (!tokenData) {
        this.debug(`Invalid upgrade request, invalid token`);
        socket.destroy();
        return;
      }

      const isRateLimited = await rateLimitService.isDeviceSocketRateLimitted(
        tokenData.deviceId
      );

      if (isRateLimited) {
        this.debug(`Rate limited device ${tokenData.deviceId}`);
        socket.destroy();
        return;
      }

      const result = await verifyToken(tokenData);
      if (!result.authenticated) {
        this.debug(`Invalid upgrade request, invalid token`);
        socket.destroy();
        return;
      }

      const account = result.account;
      wss.handleUpgrade(request, socket, head, (ws) => {
        this.debug(`Upgrading connection for device ${tokenData.deviceId}`);
        wss.emit('connection', ws, request, account);
      });
    });

    wss.on(
      'connection',
      async (
        socket: WebSocket,
        _: IncomingMessage,
        account: RequestAccount
      ) => {
        socket.on('close', () => {
          this.debug(`Closing connection for device ${account.deviceId}`);
          const connection = this.connections.get(account.deviceId);
          if (connection) {
            this.connections.delete(account.deviceId);
          }
        });

        const connection = new SocketConnection(account, socket);
        this.connections.set(account.deviceId, connection);
      }
    );
  }
}

export const socketService = new SocketService();
