import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, NodeChangeData } from '@/types/changes';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { NeuronId } from '@/lib/id';
import { ServerNode } from '@/types/nodes';

export const initNodeChangesConsumer = async () => {
  const consumer = kafka.consumer({ groupId: CONSUMER_IDS.NODE_CHANGES });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<NodeChangeData>;

      await handleNodeChange(change);
    },
  });
};

const handleNodeChange = async (change: ChangeMessage<NodeChangeData>) => {
  switch (change.op) {
    case PostgresOperation.CREATE: {
      await handleNodeCreate(change);
      break;
    }
    case PostgresOperation.UPDATE: {
      await handleNodeUpdate(change);
      break;
    }
    case PostgresOperation.DELETE: {
      await handleNodeDelete(change);
      break;
    }
  }
};

const handleNodeCreate = async (change: ChangeMessage<NodeChangeData>) => {
  const node = change.after;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNode: ServerNode = mapNode(node);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'nodes',
      action: 'insert',
      workspace_id: node.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNode),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodeUpdate = async (change: ChangeMessage<NodeChangeData>) => {
  const node = change.after;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNode: ServerNode = mapNode(node);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'nodes',
      action: 'update',
      workspace_id: node.workspace_id,
      created_at: new Date(),
      before: change.before ? JSON.stringify(change.before) : null,
      after: JSON.stringify(serverNode),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodeDelete = async (change: ChangeMessage<NodeChangeData>) => {
  const node = change.before;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNode: ServerNode = mapNode(node);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'nodes',
      action: 'delete',
      workspace_id: node.workspace_id,
      created_at: new Date(),
      before: JSON.stringify(serverNode),
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

const mapNode = (node: NodeChangeData): ServerNode => {
  return {
    id: node.id,
    workspaceId: node.workspace_id,
    parentId: node.parent_id,
    type: node.type,
    index: node.index,
    attributes: JSON.parse(node.attributes),
    state: node.state,
    createdAt: node.created_at,
    createdBy: node.created_by,
    updatedAt: node.updated_at,
    updatedBy: node.updated_by,
    versionId: node.version_id,
    serverCreatedAt: node.server_created_at,
    serverUpdatedAt: node.server_updated_at,
  };
};
