import { WebSocketServer, WebSocket } from 'ws';

import { IncomingMessage, Server } from 'http';

import { rateLimitService } from './rate-limit-service';

import { SocketConnection } from '@/services/socket-connection';
import { eventBus } from '@/lib/event-bus';
import { parseToken, verifyToken } from '@/lib/tokens';
import { createLogger } from '@/lib/logger';
import { RequestAccount } from '@/types/api';

class SocketService {
  private readonly logger = createLogger('socket-service');
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
    this.logger.info('Initializing socket service');

    const wss = new WebSocketServer({
      noServer: true,
    });

    server.on('upgrade', async (request, socket, head) => {
      if (request.url !== '/client/v1/synapse') {
        socket.destroy();
        return;
      }

      const token = request.headers['authorization'];
      if (!token) {
        socket.destroy();
        return;
      }

      const tokenData = parseToken(token);
      if (!tokenData) {
        socket.destroy();
        return;
      }

      const isRateLimited = await rateLimitService.isDeviceSocketRateLimitted(
        tokenData.deviceId
      );

      if (isRateLimited) {
        socket.destroy();
        return;
      }

      const result = await verifyToken(tokenData);
      if (!result.authenticated) {
        socket.destroy();
        return;
      }

      const account = result.account;
      wss.handleUpgrade(request, socket, head, (ws) => {
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
