import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { CdcMessage, ChangeCdcData } from '@/types/cdc';
import { redis, CHANNEL_NAMES } from '@/data/redis';
import { PostgresOperation } from '@/lib/constants';

export const initChangeCdcConsumer = async () => {
  const consumer = kafka.consumer({ groupId: CONSUMER_IDS.CHANGE_CDC });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.CHANGE_CDC });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as CdcMessage<ChangeCdcData>;

      await handleChangeCdc(change);
    },
  });
};

const handleChangeCdc = async (change: CdcMessage<ChangeCdcData>) => {
  switch (change.op) {
    case PostgresOperation.CREATE: {
      await handleChangeCreate(change);
      break;
    }
    case PostgresOperation.UPDATE: {
      await handleChangeUpdate(change);
      break;
    }
    case PostgresOperation.DELETE: {
      await handleChangeDelete(change);
      break;
    }
  }
};

const handleChangeCreate = async (change: CdcMessage<ChangeCdcData>) => {
  const changeData = change.after;
  if (!changeData) {
    return;
  }

  await redis.publish(CHANNEL_NAMES.CHANGES, JSON.stringify(changeData));
};

const handleChangeUpdate = async (change: CdcMessage<ChangeCdcData>) => {
  console.log('Change update:', change.after?.id);
};

const handleChangeDelete = async (change: CdcMessage<ChangeCdcData>) => {
  console.log('Change delete:', change.before?.id);
};
