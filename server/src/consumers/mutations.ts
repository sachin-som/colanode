import { redis, CHANNEL_NAMES } from '@/data/redis';
import { sockets } from '@/lib/sockets';
import { SocketMessage } from '@/types/sockets';
import { MutationChangeData } from '@/types/changes';
import { ServerMutation } from '@/types/mutations';

export const initMutationsSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.MUTATIONS, handleMessage);
};

const handleMessage = async (message: string) => {
  const mutationData = JSON.parse(message) as MutationChangeData;
  if (!mutationData.devices || !mutationData.devices.length) {
    return;
  }

  const mutation: ServerMutation = {
    id: mutationData.id,
    type: mutationData.type as any,
    workspaceId: mutationData.workspace_id,
    data: JSON.parse(mutationData.data),
    createdAt: mutationData.created_at,
  };

  for (const deviceId of mutationData.devices) {
    const socket = sockets.getSocket(deviceId);
    if (!socket) {
      return;
    }

    const socketMessage: SocketMessage = {
      type: 'mutation',
      payload: mutation,
    };
    socket.send(JSON.stringify(socketMessage));
  }
};
