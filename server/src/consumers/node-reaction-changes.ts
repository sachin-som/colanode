import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, NodeReactionChangeData } from '@/types/changes';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { NeuronId } from '@/lib/id';
import { ServerNodeReaction } from '@/types/nodes';

export const initNodeReactionChangesConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: CONSUMER_IDS.NODE_REACTION_CHANGES,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_REACTION_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<NodeReactionChangeData>;

      await handleNodeReactionChange(change);
    },
  });
};

const handleNodeReactionChange = async (
  change: ChangeMessage<NodeReactionChangeData>,
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
  change: ChangeMessage<NodeReactionChangeData>,
) => {
  const reaction = change.after;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeReaction: ServerNodeReaction = mapNodeReaction(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_reactions',
      action: 'insert',
      workspace_id: reaction.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodeReaction),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodeReactionDelete = async (
  change: ChangeMessage<NodeReactionChangeData>,
) => {
  const reaction = change.before;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeReaction: ServerNodeReaction = mapNodeReaction(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_reactions',
      action: 'delete',
      workspace_id: reaction.workspace_id,
      created_at: new Date(),
      before: JSON.stringify(serverNodeReaction),
      after: null,
      device_ids: deviceIds,
    })
    .execute();
};

const getDeviceIds = async (workspaceId: string) => {
  const accountDevices = await database
    .selectFrom('account_devices')
    .where(
      'account_id',
      'in',
      database
        .selectFrom('workspace_accounts')
        .where('workspace_id', '=', workspaceId)
        .select('account_id'),
    )
    .select('id')
    .execute();

  const deviceIds = accountDevices.map((account) => account.id);
  return deviceIds;
};

const mapNodeReaction = (
  reaction: NodeReactionChangeData,
): ServerNodeReaction => {
  return {
    nodeId: reaction.node_id,
    reactorId: reaction.actor_id,
    reaction: reaction.reaction,
    workspaceId: reaction.workspace_id,
    createdAt: new Date(reaction.created_at),
    serverCreatedAt: new Date(reaction.server_created_at),
  };
};
