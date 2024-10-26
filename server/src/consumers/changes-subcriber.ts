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

  const userDevices = new Map<string, string[]>();
  for (const connection of socketManager.getConnections()) {
    const workspaceUsers = connection.getWorkspaceUsers();
    for (const workspaceUser of workspaceUsers) {
      if (workspaceUser.workspaceId !== data.workspaceId) {
        continue;
      }

      const userIds = userDevices.get(workspaceUser.userId) ?? [];
      userIds.push(connection.getDeviceId());
      userDevices.set(workspaceUser.userId, userIds);
    }
  }

  const userIds = Array.from(userDevices.keys());
  if (userIds.length === 0) {
    return;
  }

  const nodeUserStates = await database
    .selectFrom('node_user_states')
    .selectAll()
    .where((eb) =>
      eb.and([eb('user_id', 'in', userIds), eb('node_id', '=', data.nodeId)]),
    )
    .execute();

  if (nodeUserStates.length === 0) {
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

  if (!node) {
    return;
  }

  for (const nodeUserState of nodeUserStates) {
    const deviceIds = userDevices.get(nodeUserState.user_id) ?? [];
    if (deviceIds.length === 0) {
      continue;
    }

    for (const deviceId of deviceIds) {
      const socketConnection = socketManager.getConnection(deviceId);
      if (socketConnection === undefined) {
        continue;
      }

      if (nodeUserState.access_removed_at !== null) {
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
  }
};
