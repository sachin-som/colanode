import { database } from '@/data/database';
import { CHANNEL_NAMES, redis } from '@/data/redis';
import { CreateDeviceNodeVersion } from '@/data/schema';
import { NodeTypes } from '@/lib/constants';
import { fetchNodeCollaborators, fetchWorkspaceUsers } from '@/lib/nodes';
import {
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeEvent,
  NodeUpdatedEvent,
} from '@/types/events';
import { ServerNodeAttributes } from '@/types/nodes';
import { Job, Queue, Worker } from 'bullmq';
import { difference, isEqual } from 'lodash';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_DB = process.env.REDIS_DB;

if (!REDIS_HOST || !REDIS_PASSWORD || !REDIS_PORT || !REDIS_DB) {
  throw new Error('Redis configuration is missing');
}

const eventQueue = new Queue('events', {
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

export const enqueueEvent = async (event: NodeEvent): Promise<void> => {
  await eventQueue.add('event', event);
};

export const initEventWorker = () => {
  return new Worker('events', handleEventJob, {
    connection: {
      host: REDIS_HOST,
      password: REDIS_PASSWORD,
      port: parseInt(REDIS_PORT),
      db: parseInt(REDIS_DB),
    },
  });
};

const handleEventJob = async (job: Job) => {
  const event = job.data as NodeEvent;

  switch (event.type) {
    case 'node_created':
      return handleNodeCreatedEvent(event);
    case 'node_updated':
      return handleNodeUpdatedEvent(event);
    case 'node_deleted':
      return handleNodeDeletedEvent(event);
  }
};

const handleNodeCreatedEvent = async (
  event: NodeCreatedEvent,
): Promise<void> => {
  const collaboratorIds: string[] = [];

  if (event.attributes.type === NodeTypes.User) {
    const userIds = await fetchWorkspaceUsers(event.workspaceId);
    collaboratorIds.push(...userIds);
  } else {
    const collaborators = await fetchNodeCollaborators(event.id);
    collaboratorIds.push(...collaborators.map((c) => c.collaboratorId));
  }

  if (collaboratorIds.length === 0) {
    return;
  }

  const deviceIds = await getDeviceIdsForCollaborators(collaboratorIds);
  await database
    .insertInto('device_node_versions')
    .values(
      deviceIds.map((deviceId) => ({
        device_id: deviceId,
        node_id: event.id,
        version_id: 'null',
        workspace_id: event.workspaceId,
        synced_at: null,
        access_removed_at: null,
      })),
    )
    .onConflict((cb) => cb.doNothing())
    .execute();

  await publishChange(event.id, event.workspaceId);
};

const handleNodeUpdatedEvent = async (
  event: NodeUpdatedEvent,
): Promise<void> => {
  const beforeCollaborators = extractCollaboratorIds(event.beforeAttributes);
  const afterCollaborators = extractCollaboratorIds(event.afterAttributes);

  const addedCollaborators = difference(
    afterCollaborators,
    beforeCollaborators,
  );

  const removedCollaborators = difference(
    beforeCollaborators,
    afterCollaborators,
  );

  if (addedCollaborators.length > 0) {
    const deviceIds = await getDeviceIdsForCollaborators(addedCollaborators);
    const descendants = await database
      .selectFrom('node_paths')
      .select('descendant_id')
      .where('ancestor_id', '=', event.id)
      .execute();

    const descendantIds = descendants.map((d) => d.descendant_id);
    const deviceNodeVersionsToCreated: CreateDeviceNodeVersion[] = [];
    for (const deviceId of deviceIds) {
      for (const descendantId of descendantIds) {
        deviceNodeVersionsToCreated.push({
          device_id: deviceId,
          node_id: descendantId,
          version_id: 'null',
          workspace_id: event.workspaceId,
          synced_at: null,
          access_removed_at: null,
        });
      }
    }

    if (deviceNodeVersionsToCreated.length > 0) {
      await database
        .insertInto('device_node_versions')
        .values(deviceNodeVersionsToCreated)
        .onConflict((cb) => cb.doNothing())
        .execute();
    }
  }

  if (removedCollaborators.length > 0) {
    const deviceIds = await getDeviceIdsForCollaborators(removedCollaborators);

    await database
      .updateTable('device_node_versions')
      .set({
        access_removed_at: new Date(),
      })
      .where((eb) =>
        eb.and([
          eb('device_id', 'in', deviceIds),
          eb(
            'node_id',
            'in',
            eb
              .selectFrom('node_paths')
              .select('descendant_id')
              .where('ancestor_id', '=', event.id),
          ),
        ]),
      )
      .execute();
  }

  await publishChange(event.id, event.workspaceId);
};

const extractCollaboratorIds = (collaborators: ServerNodeAttributes) => {
  if (!collaborators.collaborators) {
    return [];
  }

  return Object.keys(collaborators.collaborators).sort();
};

const handleNodeDeletedEvent = async (
  event: NodeDeletedEvent,
): Promise<void> => {
  await publishChange(event.id, event.workspaceId);
};

const getDeviceIdsForCollaborators = async (
  collaboratorIds: string[],
): Promise<string[]> => {
  const devices = await database
    .selectFrom('devices as d')
    .select('d.id')
    .innerJoin('workspace_users as wu', 'd.account_id', 'wu.account_id')
    .where('wu.id', 'in', collaboratorIds)
    .execute();

  return devices.map((d) => d.id);
};

const publishChange = async (
  nodeId: string,
  workspaceId: string,
): Promise<void> => {
  const changeJson = JSON.stringify({
    nodeId,
    workspaceId,
  });

  await redis.publish(CHANNEL_NAMES.CHANGES, changeJson);
};
