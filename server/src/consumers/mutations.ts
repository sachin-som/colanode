import { redis, CHANNEL_NAMES } from '@/data/redis';
import { sockets } from '@/lib/sockets';
import { SocketMessage } from '@/types/sockets';
import { ServerMutation } from '@/types/mutations';
import { MutationChangeData } from '@/types/changes';

export const initMutationsSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.MUTATIONS, handleMessage);
};

const handleMessage = async (message: string) => {
  const mutationData = JSON.parse(message) as MutationChangeData;
  if (!mutationData.device_ids || !mutationData.device_ids.length) {
    return;
  }

  const serverMutation: ServerMutation = {
    id: mutationData.id,
    action: mutationData.action as 'insert' | 'update' | 'delete',
    table: mutationData.table,
    workspaceId: mutationData.workspace_id,
    before: mutationData.before,
    after: mutationData.after,
  };

  for (const deviceId of mutationData.device_ids) {
    const socket = sockets.getSocket(deviceId);
    if (!socket) {
      continue;
    }

    const socketMessage: SocketMessage = {
      type: 'mutation',
      payload: serverMutation,
    };
    socket.send(JSON.stringify(socketMessage));
  }
};
