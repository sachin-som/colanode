import { database } from '@/data/database';
import { redis, CHANNEL_NAMES } from '@/data/redis';
import { socketManager } from '@/sockets/socket-manager';
import { ServerNodeChangeEvent } from '@/types/sync';

export const initChangesSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.CHANGES, handleEvent);
};

const handleEvent = async (event: string) => {
  const data: ServerNodeChangeEvent = JSON.parse(event);

  const deviceIds: string[] = [];
  for (const connection of socketManager.getConnections()) {
    deviceIds.push(connection.getDeviceId());
  }

  if (deviceIds.length === 0) {
    return;
  }

  const nodeVersions = await database
    .selectFrom('device_node_versions')
    .selectAll()
    .where((eb) =>
      eb.and([
        eb('device_id', 'in', deviceIds),
        eb('node_id', '=', data.nodeId),
      ]),
    )
    .execute();

  if (nodeVersions.length === 0) {
    return;
  }

  const node = await database
    .selectFrom('nodes')
    .select([
      'id',
      'state',
      'created_at',
      'created_by',
      'updated_at',
      'updated_by',
      'server_created_at',
      'server_updated_at',
      'version_id',
    ])
    .where('id', '=', data.nodeId)
    .executeTakeFirst();

  for (const nodeVersion of nodeVersions) {
    const socketConnection = socketManager.getConnection(nodeVersion.device_id);
    if (!socketConnection) {
      continue;
    }

    if (nodeVersion.access_removed_at !== null || !node) {
      socketConnection.send({
        type: 'server_node_delete',
        id: data.nodeId,
        workspaceId: data.workspaceId,
      });
    } else {
      socketConnection.send({
        type: 'server_node_sync',
        id: node.id,
        workspaceId: data.workspaceId,
        state: node.state!,
        createdAt: node.created_at.toISOString(),
        createdBy: node.created_by,
        updatedAt: node.updated_at?.toISOString() ?? null,
        updatedBy: node.updated_by ?? null,
        serverCreatedAt: node.server_created_at.toISOString(),
        serverUpdatedAt: node.server_updated_at?.toISOString() ?? null,
        versionId: node.version_id,
      });
    }
  }
};
