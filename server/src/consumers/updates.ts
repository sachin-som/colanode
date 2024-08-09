import { redis, CHANNEL_NAMES } from '@/data/redis';
import { sockets } from '@/lib/sockets';
import { Update } from '@/types/updates';

export const initUpdatesSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.UPDATES, handleMessage);
};

const handleMessage = async (_: string, message: string) => {
  const update = JSON.parse(message) as Update;
  const socket = sockets.getSocket(update.deviceId);
  if (!socket) {
    return;
  }

  socket.send(JSON.stringify(update));
};
