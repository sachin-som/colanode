import { database } from '@/data/database';
import { NodeTypes } from '@/lib/constants';
import { MessageInput } from '@/messages';
import { NeuronRequestAccount } from '@/types/api';
import { ServerNodeSyncData } from '@/types/sync';
import { WebSocket } from 'ws';

interface WorkspaceUser {
  userId: string;
  nodeIds: string[];
}

export class SocketConnection {
  private readonly socket: WebSocket;
  private readonly accountId: string;
  private readonly deviceId: string;
  private readonly workspaces: Map<string, WorkspaceUser>;

  constructor(socket: WebSocket, account: NeuronRequestAccount) {
    this.socket = socket;
    this.accountId = account.id;
    this.deviceId = account.deviceId;
    this.workspaces = new Map();

    socket.on('message', (message) => {
      this.handleMessage(message.toString());
    });
  }

  public send(message: MessageInput) {
    this.socket.send(JSON.stringify(message));
  }

  public init() {
    this.fetchWorkspaceUsers().then(() => {
      this.sendPendingChanges();
    });
  }

  public getWorkspaces(): Map<string, WorkspaceUser> {
    return this.workspaces;
  }

  private async handleMessage(message: string): Promise<void> {
    const messageInput: MessageInput = JSON.parse(message);
    if (messageInput.type === 'local_node_sync') {
      await database
        .insertInto('device_node_versions')
        .values({
          device_id: this.deviceId,
          node_id: messageInput.nodeId,
          version_id: messageInput.versionId,
          synced_at: new Date(),
        })
        .onConflict((ob) =>
          ob.columns(['device_id', 'node_id']).doUpdateSet({
            synced_at: new Date(),
            version_id: messageInput.versionId,
          }),
        )
        .execute();
    }
  }

  private async sendPendingChanges() {
    const workspaceIds = Array.from(this.workspaces.keys());
    const nodeIds = Array.from(this.workspaces.values())
      .map((user) => user.nodeIds)
      .flat();

    const unsyncedNodes = await database
      .selectFrom('nodes')
      .leftJoin('device_node_versions', (join) =>
        join
          .onRef('nodes.id', '=', 'device_node_versions.node_id')
          .on('device_node_versions.device_id', '=', this.deviceId),
      )
      .selectAll('nodes')
      .where((eb) =>
        eb.and([
          eb('nodes.workspace_id', 'in', workspaceIds),
          eb.or([
            eb('nodes.type', '=', NodeTypes.User),
            eb(
              'nodes.id',
              'in',
              database
                .selectFrom('node_paths')
                .select('descendant_id')
                .where('ancestor_id', 'in', nodeIds),
            ),
          ]),
          eb.or([
            eb('device_node_versions.node_id', 'is', null),
            eb(
              'nodes.version_id',
              '!=',
              eb.ref('device_node_versions.version_id'),
            ),
          ]),
        ]),
      )
      .orderBy('nodes.id', 'asc')
      .limit(100)
      .execute();

    if (unsyncedNodes.length === 0) {
      return;
    }

    const nodes: ServerNodeSyncData[] = [];
    for (const node of unsyncedNodes) {
      nodes.push({
        id: node.id,
        workspaceId: node.workspace_id,
        state: node.state,
        createdAt: node.created_at.toISOString(),
        createdBy: node.created_by,
        versionId: node.version_id,
        serverCreatedAt: node.created_at.toISOString(),
        serverUpdatedAt: node.updated_at?.toISOString() ?? null,
        serverDeletedAt: node.deleted_at?.toISOString() ?? null,
      });
    }

    this.send({
      type: 'server_nodes_sync',
      nodes,
    });
  }

  private async fetchWorkspaceUsers(): Promise<void> {
    const users = await database
      .selectFrom('workspace_users')
      .select(['id', 'workspace_id'])
      .where('account_id', '=', this.accountId)
      .execute();

    if (users.length === 0) {
      return;
    }

    const userIds = users.map((user) => user.id);
    const nodes = await database
      .selectFrom('node_collaborators')
      .select(['collaborator_id', 'node_id'])
      .where('collaborator_id', 'in', userIds)
      .execute();

    for (const user of users) {
      const userNodeIds = nodes
        .filter((node) => node.collaborator_id === user.id)
        .map((node) => node.node_id);

      this.workspaces.set(user.workspace_id, {
        userId: user.id,
        nodeIds: userNodeIds,
      });
    }
  }
}
