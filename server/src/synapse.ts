import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { SocketMessage } from '@/types/sockets';
import { database } from '@/data/database';
import { sql } from 'kysely';
import { SelectChange } from '@/data/schema';
import { ServerChange } from '@/types/sync';

class SynapseManager {
  private readonly sockets: Map<string, WebSocket> = new Map();

  public async addConnection(socket: WebSocket, req: IncomingMessage) {
    const deviceId = req.url?.split('device_id=')[1];
    if (!deviceId) {
      socket.close();
      return;
    }

    socket.on('message', (message) => {
      this.handleMessage(deviceId, message.toString());
    });

    socket.on('close', () => {
      this.sockets.delete(deviceId);
    });

    this.sockets.set(deviceId, socket);
    await this.sendPendingChanges(deviceId);
  }

  public send(deviceId: string, message: SocketMessage) {
    const socket = this.sockets.get(deviceId);
    if (!socket) {
      return;
    }

    socket.send(JSON.stringify(message));
  }

  private async handleMessage(
    deviceId: string,
    message: string,
  ): Promise<void> {
    const socketMessage: SocketMessage = JSON.parse(message);
    if (socketMessage.type === 'mutation_ack') {
      await this.handleMutationAck(deviceId, socketMessage);
    }
  }

  private async handleMutationAck(deviceId: string, message: SocketMessage) {
    const mutationId = message.payload.id;
    if (!mutationId) {
      return;
    }

    await database
      .updateTable('changes')
      .set({
        device_ids: sql`array_remove(device_ids, ${deviceId})`,
      })
      .where('id', '=', mutationId)
      .execute();
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
          type: 'change',
          payload: serverChange,
        });
        lastId = change.id;
      }

      hasMore = pendingChanges.rows.length === 50;
    }
  }
}

export const synapse = new SynapseManager();
