import { redis, CHANNEL_NAMES } from '@/data/redis';
import { sockets } from '@/lib/sockets';
import { Update } from '@/types/updates';
import { SocketMessage } from '@/types/sockets';

export const initUpdatesSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.UPDATES, handleMessage);
};

const handleMessage = async (message: string) => {
  const update = JSON.parse(message) as Update;
  const socket = sockets.getSocket(update.deviceId);
  if (!socket) {
    return;
  }

  const socketMessage: SocketMessage = {
    type: 'update',
    payload: update,
  };
  socket.send(JSON.stringify(socketMessage));
};
