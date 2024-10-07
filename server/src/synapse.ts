import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { database } from '@/data/database';
import { sql } from 'kysely';
import { SelectChange } from '@/data/schema';
import { ServerChange } from '@/types/sync';
import { MessageInput } from '@/messages';
import { handleChangeAck } from '@/messages/server-change-ack';
import { verifyToken } from '@/lib/tokens';
import { NeuronRequestAccount } from '@/types/api';

interface SynapseConnection {
  socket: WebSocket;
  account: NeuronRequestAccount;
}

class SynapseManager {
  private readonly sockets: Map<string, SynapseConnection> = new Map();

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
      socket.on('message', (message) => {
        this.handleMessage(account, message.toString());
      });

      socket.on('close', () => {
        this.sockets.delete(account.deviceId);
      });

      this.sockets.set(account.deviceId, {
        socket,
        account,
      });

      await this.sendPendingChanges(account.deviceId);
    });
  }

  public send(deviceId: string, message: MessageInput) {
    const connection = this.sockets.get(deviceId);
    if (!connection || !connection.socket) {
      return;
    }

    connection.socket.send(JSON.stringify(message));
  }

  private async handleMessage(
    account: NeuronRequestAccount,
    message: string,
  ): Promise<void> {
    const messageInput: MessageInput = JSON.parse(message);
    if (messageInput.type === 'server_change_ack') {
      await handleChangeAck(
        {
          accountId: account.id,
          deviceId: account.deviceId,
        },
        messageInput,
      );
    }
  }

  private async sendPendingChanges(deviceId: string) {
    let lastId = '0';
    let hasMore = true;

    while (hasMore) {
      const pendingChanges = await sql<SelectChange>`
        SELECT *
        FROM changes
        WHERE ${deviceId} = ANY(device_ids)
          AND id > ${lastId}
        ORDER BY id ASC
        LIMIT 50
      `.execute(database);

      for (const change of pendingChanges.rows) {
        const serverChange: ServerChange = {
          id: change.id,
          action: change.action as 'insert' | 'update' | 'delete',
          table: change.table,
          workspaceId: change.workspace_id,
          before: change.before,
          after: change.after,
        };

        this.send(deviceId, {
          type: 'server_change',
          change: serverChange,
        });
        lastId = change.id;
      }

      hasMore = pendingChanges.rows.length === 50;
    }
  }
}

export const synapse = new SynapseManager();
