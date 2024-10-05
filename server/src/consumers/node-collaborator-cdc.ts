import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { CdcMessage, NodeCollaboratorCdcData } from '@/types/cdc';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { generateId, IdType } from '@/lib/id';
import { ServerNodeCollaborator } from '@/types/nodes';

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

  const serverNodeCollaborator: ServerNodeCollaborator =
    mapNodeCollaborator(nodeCollaborator);
  await database
    .insertInto('changes')
    .values({
      id: generateId(IdType.Change),
      table: 'node_collaborators',
      action: 'insert',
      workspace_id: nodeCollaborator.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodeCollaborator),
      device_ids: deviceIds,
    })
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

  const serverNodeCollaborator: ServerNodeCollaborator =
    mapNodeCollaborator(nodeCollaborator);
  await database
    .insertInto('changes')
    .values({
      id: generateId(IdType.Change),
      table: 'node_collaborators',
      action: 'update',
      workspace_id: nodeCollaborator.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodeCollaborator),
      device_ids: deviceIds,
    })
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

  const serverNodeCollaborator: ServerNodeCollaborator =
    mapNodeCollaborator(nodeCollaborator);
  await database
    .insertInto('changes')
    .values({
      id: generateId(IdType.Change),
      table: 'node_collaborators',
      action: 'delete',
      workspace_id: nodeCollaborator.workspace_id,
      created_at: new Date(),
      before: JSON.stringify(serverNodeCollaborator),
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
        .selectFrom('workspace_users')
        .where('workspace_id', '=', workspaceId)
        .select('account_id'),
    )
    .select('id')
    .execute();

  const deviceIds = accountDevices.map((account) => account.id);
  return deviceIds;
};

const mapNodeCollaborator = (
  nodeCollaborator: NodeCollaboratorCdcData,
): ServerNodeCollaborator => {
  return {
    nodeId: nodeCollaborator.node_id,
    collaboratorId: nodeCollaborator.collaborator_id,
    role: nodeCollaborator.role,
    workspaceId: nodeCollaborator.workspace_id,
    createdAt: new Date(nodeCollaborator.created_at),
    createdBy: nodeCollaborator.created_by,
    updatedAt: nodeCollaborator.updated_at
      ? new Date(nodeCollaborator.updated_at)
      : null,
    updatedBy: nodeCollaborator.updated_by,
    versionId: nodeCollaborator.version_id,
    serverCreatedAt: new Date(nodeCollaborator.server_created_at),
    serverUpdatedAt: nodeCollaborator.server_updated_at
      ? new Date(nodeCollaborator.server_updated_at)
      : null,
  };
};
