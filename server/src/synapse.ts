import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { SocketMessage } from '@/types/sockets';
import { database } from './data/database';
import { sql } from 'kysely';
import { SelectMutation } from '@/data/schema';
import { ServerMutation } from '@/types/mutations';

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
    await this.sendPendingMutations(deviceId);
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
      .updateTable('mutations')
      .set({
        device_ids: sql`array_remove(device_ids, ${deviceId})`,
      })
      .where('id', '=', mutationId)
      .execute();
  }

  private async sendPendingMutations(deviceId: string) {
    let lastId = '0';
    let hasMore = true;

    while (hasMore) {
      const pendingMutations = await sql<SelectMutation>`
        SELECT *
        FROM mutations
        WHERE ${deviceId} = ANY(device_ids)
          AND id > ${lastId}
        ORDER BY id ASC
        LIMIT 50
      `.execute(database);

      for (const mutation of pendingMutations.rows) {
        const serverMutation: ServerMutation = {
          id: mutation.id,
          action: mutation.action as 'insert' | 'update' | 'delete',
          table: mutation.table,
          workspaceId: mutation.workspace_id,
          before: mutation.before,
          after: mutation.after,
        };
        this.send(deviceId, {
          type: 'mutation',
          payload: serverMutation,
        });
        lastId = mutation.id;
      }

      hasMore = pendingMutations.rows.length === 50;
    }
  }
}

export const synapse = new SynapseManager();
