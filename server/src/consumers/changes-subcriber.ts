import { redis, CHANNEL_NAMES } from '@/data/redis';
import { socketManager } from '@/sockets/socket-manager';
import { ServerChange } from '@/types/sync';
import { ChangeCdcData } from '@/types/cdc';
import { ServerChangeMessageInput } from '@/messages/server-change';

export const initChangesSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.CHANGES, handleMessage);
};

const handleMessage = async (message: string) => {
  const changeData = JSON.parse(message) as ChangeCdcData;

  const serverChange: ServerChange = {
    id: changeData.id,
    workspaceId: changeData.workspace_id,
    deviceId: changeData.device_id,
    data: JSON.parse(changeData.data),
    createdAt: changeData.created_at,
  };

  const input: ServerChangeMessageInput = {
    type: 'server_change',
    change: serverChange,
  };

  socketManager.send(changeData.device_id, input);
};
