import { database } from '@/data/database';
import { redis, CHANNEL_NAMES } from '@/data/redis';
import { socketManager } from '@/sockets/socket-manager';
import {
  ServerChange,
  ServerChangeBroadcastMessage,
  ServerChangeData,
} from '@/types/sync';

export const initChangesSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.CHANGES, handleMessage);
};

const handleMessage = async (message: string) => {
  const data: ServerChangeBroadcastMessage = JSON.parse(message);
  if (!data.deviceIds) {
    return;
  }

  if (!data.changeId) {
    return;
  }

  const connections = socketManager.getConnections(data.deviceIds);
  if (connections.length === 0) {
    return;
  }

  const change = await database
    .selectFrom('changes')
    .selectAll()
    .where('id', '=', data.changeId)
    .executeTakeFirst();

  if (!change) {
    return;
  }

  const serverChange: ServerChange = {
    id: change.id,
    workspaceId: change.workspace_id,
    data: change.data as ServerChangeData,
    createdAt: change.created_at.toISOString(),
  };

  connections.forEach((connection) => {
    connection.send({
      type: 'server_change',
      change: serverChange,
    });
  });
};
