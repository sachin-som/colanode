import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, NodePermissionChangeData } from '@/types/changes';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { NeuronId } from '@/lib/id';
import { ServerNodePermission } from '@/types/nodes';

export const initNodePermissionChangesConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: CONSUMER_IDS.NODE_PERMISSION_CHANGES,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_PERMISSION_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<NodePermissionChangeData>;

      await handleNodePermissionChange(change);
    },
  });
};

const handleNodePermissionChange = async (
  change: ChangeMessage<NodePermissionChangeData>,
) => {
  switch (change.op) {
    case PostgresOperation.CREATE: {
      await handleNodePermissionCreate(change);
      break;
    }
    case PostgresOperation.UPDATE: {
      await handleNodePermissionUpdate(change);
      break;
    }
    case PostgresOperation.DELETE: {
      await handleNodePermissionDelete(change);
      break;
    }
  }
};

const handleNodePermissionCreate = async (
  change: ChangeMessage<NodePermissionChangeData>,
) => {
  const reaction = change.after;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodePermission: ServerNodePermission =
    mapNodePermission(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_permissions',
      action: 'insert',
      workspace_id: reaction.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodePermission),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodePermissionUpdate = async (
  change: ChangeMessage<NodePermissionChangeData>,
) => {
  const reaction = change.after;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodePermission: ServerNodePermission =
    mapNodePermission(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_permissions',
      action: 'update',
      workspace_id: reaction.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodePermission),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodePermissionDelete = async (
  change: ChangeMessage<NodePermissionChangeData>,
) => {
  const reaction = change.before;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodePermission: ServerNodePermission =
    mapNodePermission(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_permissions',
      action: 'delete',
      workspace_id: reaction.workspace_id,
      created_at: new Date(),
      before: JSON.stringify(serverNodePermission),
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

const mapNodePermission = (
  reaction: NodePermissionChangeData,
): ServerNodePermission => {
  return {
    nodeId: reaction.node_id,
    collaboratorId: reaction.collaborator_id,
    permission: reaction.permission,
    workspaceId: reaction.workspace_id,
    createdAt: reaction.created_at,
    createdBy: reaction.created_by,
    updatedAt: reaction.updated_at,
    updatedBy: reaction.updated_by,
    versionId: reaction.version_id,
    serverCreatedAt: reaction.server_created_at,
    serverUpdatedAt: reaction.server_updated_at,
  };
};
