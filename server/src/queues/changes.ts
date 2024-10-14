import { database } from '@/data/database';
import { CHANNEL_NAMES, redis } from '@/data/redis';
import { getIdType, IdType } from '@/lib/id';
import { fetchNodeTree } from '@/lib/nodes';
import { ServerChangeData } from '@/types/sync';
import { Job, Queue, Worker } from 'bullmq';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_DB = process.env.REDIS_DB;

if (!REDIS_HOST || !REDIS_PASSWORD || !REDIS_PORT || !REDIS_DB) {
  throw new Error('Redis configuration is missing');
}

export const queue = new Queue('changes', {
  connection: {
    host: REDIS_HOST,
    password: REDIS_PASSWORD,
    port: parseInt(REDIS_PORT),
    db: parseInt(REDIS_DB),
  },
  defaultJobOptions: {
    removeOnComplete: true,
  },
});

export const enqueueChange = async (id: string): Promise<void> => {
  await queue.add('change', { id }, { jobId: id });
};

export const enqueueChanges = async (ids: string[]): Promise<void> => {
  await queue.addBulk(ids.map((id) => ({ name: 'change', data: { id } })));
};

export const initChangeWorker = () => {
  return new Worker('changes', handleChangeJob, {
    connection: {
      host: REDIS_HOST,
      password: REDIS_PASSWORD,
      port: parseInt(REDIS_PORT),
      db: parseInt(REDIS_DB),
    },
  });
};

const handleChangeJob = async (job: Job) => {
  try {
    const changeId = job.data.id;
    const change = await database
      .selectFrom('changes')
      .selectAll()
      .where('id', '=', changeId)
      .executeTakeFirst();

    if (!change) {
      return;
    }

    if (change.notified_at) {
      console.log('change already notified');
      return;
    }

    const changeData = change.data as ServerChangeData;
    const nodeId = getNodeId(changeData);
    if (!nodeId) {
      return;
    }

    const deviceIds = await fetchDevicesForNode(change.workspace_id, nodeId);
    if (deviceIds.length === 0) {
      return;
    }

    await database.transaction().execute(async (trx) => {
      await trx
        .insertInto('change_devices')
        .values(
          deviceIds.map((deviceId) => ({
            change_id: changeId,
            device_id: deviceId,
            retry_count: 0,
          })),
        )
        .execute();

      await trx
        .updateTable('changes')
        .set({ notified_at: new Date() })
        .where('id', '=', changeId)
        .execute();
    });

    redis.publish(
      CHANNEL_NAMES.CHANGES,
      JSON.stringify({
        changeId,
        deviceIds,
      }),
    );
  } catch (error) {
    console.error('error', error);
  }
};

const getNodeId = (changeData: ServerChangeData): string | null => {
  switch (changeData.type) {
    case 'node_create':
      return changeData.id;
    case 'node_update':
      return changeData.id;
    case 'node_delete':
      return changeData.id;
    case 'node_collaborator_create':
      return changeData.nodeId;
    case 'node_collaborator_update':
      return changeData.nodeId;
    case 'node_collaborator_delete':
      return changeData.nodeId;
    case 'node_reaction_create':
      return changeData.nodeId;
    case 'node_reaction_delete':
      return changeData.nodeId;
    default:
      return null;
  }
};

const fetchDevicesForNode = async (
  workspaceId: string,
  nodeId: string,
): Promise<string[]> => {
  const idType = getIdType(nodeId);
  if (idType === IdType.User) {
    return fetchAllWorkspaceDevices(workspaceId);
  }

  const nodeTree = await fetchNodeTree(nodeId);
  return fetchDevicesForNodes(nodeTree);
};

const fetchAllWorkspaceDevices = async (
  workspaceId: string,
): Promise<string[]> => {
  const deviceIds = await database
    .selectFrom('workspace_users as wu')
    .fullJoin('account_devices as ad', 'wu.account_id', 'ad.account_id')
    .select('ad.id')
    .where('wu.workspace_id', '=', workspaceId)
    .execute();

  return deviceIds
    .map((row) => row.id)
    .filter((id): id is string => id !== null);
};

const fetchDevicesForNodes = async (nodeIds: string[]): Promise<string[]> => {
  const deviceIds = await database
    .selectFrom('node_collaborators as nc')
    .fullJoin('workspace_users as wu', 'nc.collaborator_id', 'wu.id')
    .fullJoin('account_devices as ad', 'wu.account_id', 'ad.account_id')
    .select('ad.id')
    .where('nc.node_id', 'in', nodeIds)
    .execute();

  return deviceIds
    .map((row) => row.id)
    .filter((id): id is string => id !== null);
};
