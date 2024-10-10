import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { CdcMessage, NodeCollaboratorCdcData } from '@/types/cdc';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { generateId, IdType } from '@/lib/id';
import {
  ServerNodeCollaboratorCreateChangeData,
  ServerNodeCollaboratorDeleteChangeData,
  ServerNodeCollaboratorUpdateChangeData,
} from '@/types/sync';

export const initNodeCollaboratorChangesConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: CONSUMER_IDS.NODE_COLLABORATOR_CDC,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_COLLABORATOR_CDC });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as CdcMessage<NodeCollaboratorCdcData>;

      await handleNodeCollaboratorCdc(change);
    },
  });
};

const handleNodeCollaboratorCdc = async (
  change: CdcMessage<NodeCollaboratorCdcData>,
) => {
  switch (change.op) {
    case PostgresOperation.CREATE: {
      await handleNodeCollaboratorCreate(change);
      break;
    }
    case PostgresOperation.UPDATE: {
      await handleNodeCollaboratorUpdate(change);
      break;
    }
    case PostgresOperation.DELETE: {
      await handleNodeCollaboratorDelete(change);
      break;
    }
  }
};

const handleNodeCollaboratorCreate = async (
  change: CdcMessage<NodeCollaboratorCdcData>,
) => {
  const nodeCollaborator = change.after;
  if (!nodeCollaborator) {
    return;
  }

  const deviceIds = await getDeviceIds(nodeCollaborator.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeCollaboratorCreateChangeData = {
    type: 'node_collaborator_create',
    nodeId: nodeCollaborator.node_id,
    collaboratorId: nodeCollaborator.collaborator_id,
    role: nodeCollaborator.role,
    workspaceId: nodeCollaborator.workspace_id,
    createdAt: nodeCollaborator.created_at,
    createdBy: nodeCollaborator.created_by,
    versionId: nodeCollaborator.version_id,
    serverCreatedAt: nodeCollaborator.server_created_at,
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: nodeCollaborator.workspace_id,
          data: JSON.stringify(data),
          created_at: new Date(),
          retry_count: 0,
        };
      }),
    )
    .execute();
};

const handleNodeCollaboratorUpdate = async (
  change: CdcMessage<NodeCollaboratorCdcData>,
) => {
  const nodeCollaborator = change.after;
  if (!nodeCollaborator) {
    return;
  }

  const deviceIds = await getDeviceIds(nodeCollaborator.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeCollaboratorUpdateChangeData = {
    type: 'node_collaborator_update',
    nodeId: nodeCollaborator.node_id,
    collaboratorId: nodeCollaborator.collaborator_id,
    role: nodeCollaborator.role,
    workspaceId: nodeCollaborator.workspace_id,
    updatedAt: nodeCollaborator.updated_at ?? new Date().toISOString(),
    updatedBy: nodeCollaborator.updated_by ?? nodeCollaborator.created_by,
    versionId: nodeCollaborator.version_id,
    serverUpdatedAt:
      nodeCollaborator.server_updated_at ?? new Date().toISOString(),
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: nodeCollaborator.workspace_id,
          data: JSON.stringify(data),
          created_at: new Date(),
          retry_count: 0,
        };
      }),
    )
    .execute();
};

const handleNodeCollaboratorDelete = async (
  change: CdcMessage<NodeCollaboratorCdcData>,
) => {
  const nodeCollaborator = change.before;
  if (!nodeCollaborator) {
    return;
  }

  const deviceIds = await getDeviceIds(nodeCollaborator.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const data: ServerNodeCollaboratorDeleteChangeData = {
    type: 'node_collaborator_delete',
    nodeId: nodeCollaborator.node_id,
    collaboratorId: nodeCollaborator.collaborator_id,
    workspaceId: nodeCollaborator.workspace_id,
  };

  await database
    .insertInto('changes')
    .values(
      deviceIds.map((deviceId) => {
        return {
          id: generateId(IdType.Change),
          device_id: deviceId,
          workspace_id: nodeCollaborator.workspace_id,
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
