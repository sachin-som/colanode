import { database } from '@/data/database';
import { MessageInput } from '@/messages';
import { NeuronRequestAccount } from '@/types/api';
import { WebSocket } from 'ws';

interface WorkspaceUser {
  workspaceId: string;
  userId: string;
}

export class SocketConnection {
  private readonly socket: WebSocket;
  private readonly accountId: string;
  private readonly deviceId: string;
  private readonly workspaceUsers: WorkspaceUser[];

  constructor(socket: WebSocket, account: NeuronRequestAccount) {
    this.socket = socket;
    this.accountId = account.id;
    this.deviceId = account.deviceId;
    this.workspaceUsers = [];

    socket.on('message', (message) => {
      this.handleMessage(message.toString());
    });
  }

  public send(message: MessageInput): void {
    this.socket.send(JSON.stringify(message));
  }

  public init(): void {
    this.fetchWorkspaceUsers().then(() => {
      this.sendPendingChanges();
    });
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getWorkspaceUsers(): WorkspaceUser[] {
    return this.workspaceUsers;
  }

  public addWorkspaceUser(workspaceUser: WorkspaceUser): void {
    if (this.workspaceUsers.find((wu) => wu.userId === workspaceUser.userId)) {
      return;
    }

    this.workspaceUsers.push(workspaceUser);
    this.sendPendingChanges();
  }

  private async fetchWorkspaceUsers(): Promise<void> {
    const workspaceUsers = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('account_id', '=', this.accountId)
      .execute();

    for (const workspaceUser of workspaceUsers) {
      this.workspaceUsers.push({
        workspaceId: workspaceUser.workspace_id,
        userId: workspaceUser.id,
      });
    }
  }

  private async handleMessage(message: string): Promise<void> {
    const messageInput: MessageInput = JSON.parse(message);
    console.log(messageInput);
    if (messageInput.type === 'local_node_sync') {
      await database
        .insertInto('node_device_states')
        .values({
          node_id: messageInput.nodeId,
          device_id: this.deviceId,
          node_version_id: messageInput.versionId,
          user_state_version_id: null,
          user_state_synced_at: null,
          workspace_id: messageInput.workspaceId,
          node_synced_at: new Date(),
        })
        .onConflict((cb) =>
          cb.columns(['node_id', 'device_id']).doUpdateSet({
            workspace_id: messageInput.workspaceId,
            node_version_id: messageInput.versionId,
            node_synced_at: new Date(),
          }),
        )
        .execute();
    } else if (messageInput.type === 'local_node_delete') {
      await database
        .deleteFrom('node_device_states')
        .where('device_id', '=', this.deviceId)
        .where('node_id', '=', messageInput.nodeId)
        .execute();
    }
  }

  private async sendPendingChanges() {
    const userIds = this.workspaceUsers.map(
      (workspaceUser) => workspaceUser.userId,
    );

    if (userIds.length === 0) {
      return;
    }

    console.log('userIds', userIds);

    const unsyncedNodes = await database
      .selectFrom('node_user_states as nus')
      .leftJoin('nodes as n', 'n.id', 'nus.node_id')
      .leftJoin('node_device_states as nds', (join) =>
        join
          .onRef('nds.node_id', '=', 'n.id')
          .on('nds.device_id', '=', this.deviceId),
      )
      .select([
        'n.id',
        'n.state',
        'n.created_at',
        'n.created_by',
        'n.updated_at',
        'n.updated_by',
        'n.server_created_at',
        'n.server_updated_at',
        'nus.access_removed_at',
        'n.version_id',
        'nus.node_id',
        'nus.workspace_id',
      ])
      .where((eb) =>
        eb.and([
          eb('nus.user_id', 'in', userIds),
          eb.or([
            eb('n.id', 'is', null),
            eb('nds.node_version_id', 'is', null),
            eb('nds.node_version_id', '!=', eb.ref('n.version_id')),
            eb('nus.access_removed_at', 'is not', null),
          ]),
        ]),
      )
      .orderBy('n.id', 'asc')
      .limit(100)
      .execute();

    console.log('unsyncedNodes', unsyncedNodes);

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
