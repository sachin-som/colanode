import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, UpdateChangeData } from '@/types/changes';
import { redis, CHANNEL_NAMES } from '@/data/redis';
import { Update } from '@/types/updates';

export const initUpdateChangesConsumer = async () => {
  const consumer = kafka.consumer({ groupId: CONSUMER_IDS.UPDATE_CHANGES });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.UPDATE_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<UpdateChangeData>;

      await handleUpdateChange(change);
    },
  });
};

const handleUpdateChange = async (change: ChangeMessage<UpdateChangeData>) => {
  const changeData = change.after;
  if (!changeData) {
    return;
  }

  const devices = changeData.devices;
  for (const deviceId of devices) {
    const update: Update = {
      id: changeData.id,
      deviceId: deviceId,
      type: changeData.type,
      content: changeData.content,
      workspaceId: changeData.workspace_id,
      createdAt: changeData.created_at,
    };

    await redis.publish(CHANNEL_NAMES.UPDATES, JSON.stringify(update));
  }
};
