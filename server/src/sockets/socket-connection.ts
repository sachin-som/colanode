import { database } from '@/data/database';
import { MessageInput } from '@/messages';
import { NeuronRequestAccount } from '@/types/api';
import { WebSocket } from 'ws';

export class SocketConnection {
  private readonly socket: WebSocket;
  private readonly accountId: string;
  private readonly deviceId: string;

  constructor(socket: WebSocket, account: NeuronRequestAccount) {
    this.socket = socket;
    this.accountId = account.id;
    this.deviceId = account.deviceId;

    socket.on('message', (message) => {
      this.handleMessage(message.toString());
    });
  }

  public send(message: MessageInput): void {
    this.socket.send(JSON.stringify(message));
  }

  public init(): void {
    this.sendPendingChanges();
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  private async handleMessage(message: string): Promise<void> {
    const messageInput: MessageInput = JSON.parse(message);
    console.log(messageInput);
    if (messageInput.type === 'local_node_sync') {
      await database
        .updateTable('device_node_versions')
        .set({
          version_id: messageInput.versionId,
          synced_at: new Date(),
        })
        .where('device_id', '=', this.deviceId)
        .where('node_id', '=', messageInput.nodeId)
        .execute();
    } else if (messageInput.type === 'local_node_delete') {
      await database
        .deleteFrom('device_node_versions')
        .where('device_id', '=', this.deviceId)
        .where('node_id', '=', messageInput.nodeId)
        .where('workspace_id', '=', messageInput.workspaceId)
        .execute();
    }
  }

  private async sendPendingChanges() {
    const unsyncedNodes = await database
      .selectFrom('device_node_versions as dnv')
      .leftJoin('nodes as n', 'n.id', 'dnv.node_id')
      .select([
        'n.id',
        'n.state',
        'n.created_at',
        'n.created_by',
        'n.updated_at',
        'n.updated_by',
        'n.server_created_at',
        'n.server_updated_at',
        'dnv.access_removed_at',
        'n.version_id',
        'dnv.node_id',
        'dnv.workspace_id',
      ])
      .where((eb) =>
        eb.and([
          eb('dnv.device_id', '=', this.deviceId),
          eb.or([
            eb('n.id', 'is', null),
            eb('dnv.version_id', '!=', eb.ref('n.version_id')),
            eb('dnv.access_removed_at', 'is not', null),
          ]),
        ]),
      )
      .orderBy('n.id', 'asc')
      .limit(100)
      .execute();

    if (unsyncedNodes.length === 0) {
      return;
    }

    for (const row of unsyncedNodes) {
      if (row.id === null) {
        this.send({
          type: 'server_node_delete',
          id: row.node_id,
          workspaceId: row.workspace_id,
        });
      } else {
        this.send({
          type: 'server_node_sync',
          id: row.id,
          workspaceId: row.workspace_id,
          state: row.state!,
          createdAt: row.created_at!.toISOString(),
          createdBy: row.created_by!,
          updatedAt: row.updated_at?.toISOString() ?? null,
          updatedBy: row.updated_by ?? null,
          serverCreatedAt: row.server_created_at!.toISOString(),
          serverUpdatedAt: row.server_updated_at?.toISOString() ?? null,
          versionId: row.version_id!,
        });
      }
    }
  }
}
