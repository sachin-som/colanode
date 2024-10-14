import { database } from '@/data/database';
import { MessageInput } from '@/messages';
import { NeuronRequestAccount } from '@/types/api';
import { ServerChange } from '@/types/sync';
import { WebSocket } from 'ws';

export class SocketConnection {
  private readonly socket: WebSocket;
  private readonly pendingChanges: Set<string> = new Set();

  public accountId: string;
  public deviceId: string;

  constructor(socket: WebSocket, account: NeuronRequestAccount) {
    this.socket = socket;
    this.accountId = account.id;
    this.deviceId = account.deviceId;

    socket.on('message', (message) => {
      this.handleMessage(message.toString());
    });
  }

  public send(message: MessageInput) {
    if (message.type === 'server_change') {
      const changeId = message.change.id;
      if (this.pendingChanges.size > 0) {
        return;
      }

      this.pendingChanges.add(changeId);
    } else if (message.type === 'server_change_batch') {
      if (this.pendingChanges.size > 0) {
        return;
      }

      message.changes.forEach((change) => {
        this.pendingChanges.add(change.id);
      });
    }
    this.socket.send(JSON.stringify(message));
  }

  public init() {
    this.sendPendingChanges();
  }

  private async handleMessage(message: string): Promise<void> {
    const messageInput: MessageInput = JSON.parse(message);
    if (messageInput.type === 'server_change_result') {
      if (messageInput.success) {
        await database
          .deleteFrom('change_devices')
          .where((eb) =>
            eb.and([
              eb('change_id', '=', messageInput.changeId),
              eb('device_id', '=', this.deviceId),
            ]),
          )
          .execute();
      } else {
        await database
          .updateTable('change_devices')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where((eb) =>
            eb.and([
              eb('change_id', '=', messageInput.changeId),
              eb('device_id', '=', this.deviceId),
            ]),
          )
          .execute();
      }

      this.pendingChanges.delete(messageInput.changeId);
      if (this.pendingChanges.size === 0) {
        this.sendPendingChanges();
      }
    }
  }

  private async sendPendingChanges() {
    const changes = await database
      .selectFrom('changes as c')
      .innerJoin('change_devices as cd', 'c.id', 'cd.change_id')
      .select([
        'c.id',
        'c.workspace_id',
        'cd.device_id',
        'c.created_at',
        'c.data',
      ])
      .where('cd.device_id', '=', this.deviceId)
      .orderBy('id', 'asc')
      .limit(100)
      .execute();

    if (changes.length === 0) {
      return;
    }

    const serverChanges: ServerChange[] = [];
    for (const change of changes) {
      if (
        !change.id ||
        !change.workspace_id ||
        !change.created_at ||
        !change.data
      ) {
        continue;
      }

      serverChanges.push({
        id: change.id,
        workspaceId: change.workspace_id,
        createdAt: change.created_at.toISOString(),
        data: change.data,
      });
    }

    this.send({
      type: 'server_change_batch',
      changes: serverChanges,
    });
  }
}
