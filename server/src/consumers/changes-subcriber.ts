import { redis, CHANNEL_NAMES } from '@/data/redis';
import { synapse } from '@/synapse';
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
  if (!changeData.device_ids || !changeData.device_ids.length) {
    return;
  }

  const serverChange: ServerChange = {
    id: changeData.id,
    action: changeData.action as 'insert' | 'update' | 'delete',
    table: changeData.table,
    workspaceId: changeData.workspace_id,
    before: changeData.before ? JSON.parse(changeData.before) : null,
    after: changeData.after ? JSON.parse(changeData.after) : null,
  };

  const input: ServerChangeMessageInput = {
    type: 'server_change',
    change: serverChange,
  };

  for (const deviceId of changeData.device_ids) {
    synapse.send(deviceId, input);
  }
};
