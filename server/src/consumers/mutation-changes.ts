import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, MutationChangeData } from '@/types/changes';
import { redis, CHANNEL_NAMES } from '@/data/redis';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';

export const initMutationChangesConsumer = async () => {
  const consumer = kafka.consumer({ groupId: CONSUMER_IDS.MUTATION_CHANGES });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.MUTATION_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<MutationChangeData>;

      await handleMutationChange(change);
    },
  });
};

const handleMutationChange = async (
  change: ChangeMessage<MutationChangeData>,
) => {
  switch (change.op) {
    case PostgresOperation.CREATE: {
      await handleMutationCreate(change);
      break;
    }
    case PostgresOperation.UPDATE: {
      await handleMutationUpdate(change);
      break;
    }
    case PostgresOperation.DELETE: {
      await handleMutationDelete(change);
      break;
    }
  }
};

const handleMutationCreate = async (
  change: ChangeMessage<MutationChangeData>,
) => {
  const mutationData = change.after;
  if (!mutationData) {
    return;
  }

  await redis.publish(CHANNEL_NAMES.MUTATIONS, JSON.stringify(mutationData));
};

const handleMutationUpdate = async (
  change: ChangeMessage<MutationChangeData>,
) => {
  const mutationData = change.after;
  if (!mutationData) {
    return;
  }

  // if all devices have acknowledged the mutation, delete it
  if (mutationData.device_ids == null || mutationData.device_ids.length == 0) {
    await database
      .deleteFrom('mutations')
      .where('id', '=', mutationData.id)
      .execute();
  }
};

const handleMutationDelete = async (
  change: ChangeMessage<MutationChangeData>,
) => {
  console.log('Mutation delete:', change.before?.id);
};
