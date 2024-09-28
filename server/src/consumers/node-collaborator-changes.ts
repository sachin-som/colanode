import { kafka, TOPIC_NAMES, CONSUMER_IDS } from '@/data/kafka';
import { ChangeMessage, NodeCollaboratorChangeData } from '@/types/changes';
import { PostgresOperation } from '@/lib/constants';
import { database } from '@/data/database';
import { NeuronId } from '@/lib/id';
import { ServerNodeCollaborator } from '@/types/nodes';

export const initNodeCollaboratorChangesConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: CONSUMER_IDS.NODE_COLLABORATOR_CHANGES,
  });

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAMES.NODE_COLLABORATOR_CHANGES });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message || !message.value) {
        return;
      }

      const change = JSON.parse(
        message.value.toString(),
      ) as ChangeMessage<NodeCollaboratorChangeData>;

      await handleNodeCollaboratorChange(change);
    },
  });
};

const handleNodeCollaboratorChange = async (
  change: ChangeMessage<NodeCollaboratorChangeData>,
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
  change: ChangeMessage<NodeCollaboratorChangeData>,
) => {
  const reaction = change.after;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeCollaborator: ServerNodeCollaborator =
    mapNodeCollaborator(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_collaborators',
      action: 'insert',
      workspace_id: reaction.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodeCollaborator),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodeCollaboratorUpdate = async (
  change: ChangeMessage<NodeCollaboratorChangeData>,
) => {
  const reaction = change.after;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeCollaborator: ServerNodeCollaborator =
    mapNodeCollaborator(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_collaborators',
      action: 'update',
      workspace_id: reaction.workspace_id,
      created_at: new Date(),
      after: JSON.stringify(serverNodeCollaborator),
      device_ids: deviceIds,
    })
    .execute();
};

const handleNodeCollaboratorDelete = async (
  change: ChangeMessage<NodeCollaboratorChangeData>,
) => {
  const reaction = change.before;
  if (!reaction) {
    return;
  }

  const deviceIds = await getDeviceIds(reaction.workspace_id);
  if (deviceIds.length == 0) {
    return;
  }

  const serverNodeCollaborator: ServerNodeCollaborator =
    mapNodeCollaborator(reaction);
  await database
    .insertInto('mutations')
    .values({
      id: NeuronId.generate(NeuronId.Type.Mutation),
      table: 'node_collaborators',
      action: 'delete',
      workspace_id: reaction.workspace_id,
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
        .selectFrom('workspace_accounts')
        .where('workspace_id', '=', workspaceId)
        .select('account_id'),
    )
    .select('id')
    .execute();

  const deviceIds = accountDevices.map((account) => account.id);
  return deviceIds;
};

const mapNodeCollaborator = (
  reaction: NodeCollaboratorChangeData,
): ServerNodeCollaborator => {
  return {
    nodeId: reaction.node_id,
    collaboratorId: reaction.collaborator_id,
    role: reaction.role,
    workspaceId: reaction.workspace_id,
    createdAt: new Date(reaction.created_at),
    createdBy: reaction.created_by,
    updatedAt: reaction.updated_at ? new Date(reaction.updated_at) : null,
    updatedBy: reaction.updated_by,
    versionId: reaction.version_id,
    serverCreatedAt: new Date(reaction.server_created_at),
    serverUpdatedAt: reaction.server_updated_at
      ? new Date(reaction.server_updated_at)
      : null,
  };
};
