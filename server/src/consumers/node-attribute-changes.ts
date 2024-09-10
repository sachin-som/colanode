import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, NodeAttributeChangeData } from '@/types/changes';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { NeuronId } from '@/lib/id';
import { ServerNode, ServerNodeAttribute } from '@/types/nodes';

export const initNodeAttributeChangesConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: CONSUMER_IDS.NODE_ATTRIBUTE_CHANGES,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_ATTRIBUTE_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<NodeAttributeChangeData>;

      await handleNodeAttributeChange(change);
    },
  });
};

const handleNodeAttributeChange = async (
  change: ChangeMessage<NodeAttributeChangeData>,
) => {
  switch (change.op) {
    case PostgresOperation.CREATE: {
      await handleNodeAttributeCreate(change);
      break;
    }
    case PostgresOperation.UPDATE: {
      await handleNodeAttributeUpdate(change);
      break;
    }
    case PostgresOperation.DELETE: {
      await handleNodeAttributeDelete(change);
      break;
    }
  }
};

const handleNodeAttributeCreate = async (
  change: ChangeMessage<NodeAttributeChangeData>,
) => {
  const node = change.after;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeAttribute: ServerNodeAttribute = mapNodeAttribute(node);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_attributes',
      action: 'insert',
      workspace_id: node.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodeAttribute),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodeAttributeUpdate = async (
  change: ChangeMessage<NodeAttributeChangeData>,
) => {
  const node = change.after;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeAttribute: ServerNodeAttribute = mapNodeAttribute(node);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_attributes',
      action: 'update',
      workspace_id: node.workspace_id,
      created_at: new Date(),
      before: change.before ? JSON.stringify(change.before) : null,
      after: JSON.stringify(serverNodeAttribute),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodeAttributeDelete = async (
  change: ChangeMessage<NodeAttributeChangeData>,
) => {
  const node = change.before;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeAttribute: ServerNodeAttribute = mapNodeAttribute(node);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_attributes',
      action: 'delete',
      workspace_id: node.workspace_id,
      created_at: new Date(),
      before: JSON.stringify(serverNodeAttribute),
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

const mapNodeAttribute = (
  node: NodeAttributeChangeData,
): ServerNodeAttribute => {
  return {
    nodeId: node.node_id,
    type: node.type,
    key: node.key,
    workspaceId: node.workspace_id,
    textValue: node.text_value,
    numberValue: node.number_value,
    foreignNodeId: node.foreign_node_id,
    createdAt: node.created_at,
    createdBy: node.created_by,
    updatedAt: node.updated_at,
    updatedBy: node.updated_by,
    versionId: node.version_id,
    serverCreatedAt: node.server_created_at,
    serverUpdatedAt: node.server_updated_at,
  };
};
