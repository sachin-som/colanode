import http from 'http';
import { WebSocketServer } from 'ws';
import { verifyToken } from '@/lib/tokens';
import { SocketConnection } from '@/sockets/socket-connection';
import { MessageInput } from '@/messages';

class SocketManager {
  private readonly sockets: Map<string, SocketConnection> = new Map();

  public init(server: http.Server) {
    const wss = new WebSocketServer({
      server,
      path: '/v1/synapse',
      verifyClient: async (info, callback) => {
        const req = info.req;
        const token = req.headers['authorization'];

        if (!token) {
          return callback(false, 401, 'Unauthorized');
        }

        callback(true);
      },
    });

    wss.on('connection', async (socket, req) => {
      const token = req.headers['authorization'];
      if (!token) {
        socket.close();
        return;
      }

      const result = await verifyToken(token);
      if (!result.authenticated) {
        socket.close();
        return;
      }

      const account = result.account;

      socket.on('close', () => {
        this.sockets.delete(account.deviceId);
      });

      const connection = new SocketConnection(socket, account);
      connection.init();

      this.sockets.set(account.deviceId, connection);
    });
  }

  public getConnections(): IterableIterator<SocketConnection> {
    return this.sockets.values();
  }

  public send(deviceId: string, message: MessageInput) {
    const connection = this.sockets.get(deviceId);
    if (!connection) {
      return;
    }

    connection.send(message);
  }
}

export const socketManager = new SocketManager();
