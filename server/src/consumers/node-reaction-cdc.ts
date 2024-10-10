import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { CdcMessage, NodeReactionCdcData } from '@/types/cdc';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { generateId, IdType } from '@/lib/id';
import {
  ServerNodeReactionCreateChangeData,
  ServerNodeReactionDeleteChangeData,
} from '@/types/sync';

export const initNodeReactionChangesConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: CONSUMER_IDS.NODE_REACTION_CDC,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_REACTION_CDC });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as CdcMessage<NodeReactionCdcData>;

      await handleNodeReactionCdc(change);
    },
  });
};

const handleNodeReactionCdc = async (
  change: CdcMessage<NodeReactionCdcData>,
) => {
  switch (change.op) {
    case PostgresOperation.CREATE: {
      await handleNodeReactionCreate(change);
      break;
    }
    case PostgresOperation.DELETE: {
      await handleNodeReactionDelete(change);
      break;
    }
  }
};

const handleNodeReactionCreate = async (
  change: CdcMessage<NodeReactionCdcData>,
) => {
  const reaction = change.after;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeReactionCreateChangeData = {
    type: 'node_reaction_create',
    nodeId: reaction.node_id,
    actorId: reaction.actor_id,
    reaction: reaction.reaction,
    workspaceId: reaction.workspace_id,
    createdAt: reaction.created_at,
    serverCreatedAt: reaction.server_created_at,
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: reaction.workspace_id,
          data: JSON.stringify(data),
          created_at: new Date(),
          retry_count: 0,
        };
      }),
    )
    .execute();
};

const handleNodeReactionDelete = async (
  change: CdcMessage<NodeReactionCdcData>,
) => {
  const reaction = change.before;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeReactionDeleteChangeData = {
    type: 'node_reaction_delete',
    nodeId: reaction.node_id,
    actorId: reaction.actor_id,
    reaction: reaction.reaction,
    workspaceId: reaction.workspace_id,
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: reaction.workspace_id,
          data: JSON.stringify(data),
          created_at: new Date(),
          retry_count: 0,
        };
      }),
    )
    .execute();
};

const getDeviceIds = async (workspaceId: string) => {
  const accountDevices = await database
    .selectFrom('account_devices')
    .where(
      'account_id',
      'in',
      database
        .selectFrom('workspace_users')
        .where('workspace_id', '=', workspaceId)
        .select('account_id'),
    )
    .select('id')
    .execute();

  const deviceIds = accountDevices.map((account) => account.id);
  return deviceIds;
};
