import { database } from '@/data/database';
import { MessageInput } from '@/messages';
import { NeuronRequestAccount } from '@/types/api';
import { WebSocket } from 'ws';

export class SocketConnection {
  private readonly socket: WebSocket;
  private readonly account: NeuronRequestAccount;
  private readonly pendingChanges: Set<string> = new Set();

  constructor(socket: WebSocket, account: NeuronRequestAccount) {
    this.socket = socket;
    this.account = account;

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
          .deleteFrom('changes')
          .where('id', '=', messageInput.changeId)
          .execute();
      } else {
        await database
          .updateTable('changes')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('id', '=', messageInput.changeId)
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
      .selectFrom('changes')
      .selectAll()
      .where('device_id', '=', this.account.deviceId)
      .orderBy('id', 'asc')
      .limit(100)
      .execute();

    if (changes.length === 0) {
      return;
    }

    this.send({
      type: 'server_change_batch',
      changes: changes.map((change) => ({
        id: change.id,
        workspaceId: change.workspace_id,
        deviceId: change.device_id,
        createdAt: change.created_at.toISOString(),
        data: change.data,
      })),
    });
  }
}
