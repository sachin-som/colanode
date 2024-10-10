import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { CdcMessage, NodeCdcData } from '@/types/cdc';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { generateId, IdType } from '@/lib/id';
import {
  ServerNodeCreateChangeData,
  ServerNodeDeleteChangeData,
  ServerNodeUpdateChangeData,
} from '@/types/sync';

export const initNodeChangesConsumer = async () => {
  const consumer = kafka.consumer({ groupId: CONSUMER_IDS.NODE_CDC });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_CDC });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as CdcMessage<NodeCdcData>;

      await handleNodeCdc(change);
    },
  });
};

const handleNodeCdc = async (change: CdcMessage<NodeCdcData>) => {
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

const handleNodeCreate = async (change: CdcMessage<NodeCdcData>) => {
  const node = change.after;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeCreateChangeData = {
    type: 'node_create',
    id: node.id,
    workspaceId: node.workspace_id,
    state: node.state,
    createdAt: node.created_at,
    createdBy: node.created_by,
    serverCreatedAt: node.server_created_at,
    versionId: node.version_id,
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: node.workspace_id,
          data: JSON.stringify(data),
          created_at: new Date(),
          retry_count: 0,
        };
      }),
    )
    .execute();
};

const handleNodeUpdate = async (change: CdcMessage<NodeCdcData>) => {
  const node = change.after;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeUpdateChangeData = {
    type: 'node_update',
    id: node.id,
    workspaceId: node.workspace_id,
    update: node.state,
    updatedAt: node.updated_at ?? new Date().toISOString(),
    updatedBy: node.updated_by ?? node.created_by,
    serverUpdatedAt: node.server_updated_at ?? new Date().toISOString(),
    versionId: node.version_id,
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: node.workspace_id,
          data: JSON.stringify(data),
          created_at: new Date(),
          retry_count: 0,
        };
      }),
    )
    .execute();
};

const handleNodeDelete = async (change: CdcMessage<NodeCdcData>) => {
  const node = change.before;
  if (!node) {
    return;
  }

  const deviceIds = await getDeviceIds(node.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeDeleteChangeData = {
    type: 'node_delete',
    id: node.id,
    workspaceId: node.workspace_id,
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: node.workspace_id,
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
