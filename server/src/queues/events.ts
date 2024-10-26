import { database } from '@/data/database';
import { CHANNEL_NAMES, redis } from '@/data/redis';
import { CreateNodeUserState } from '@/data/schema';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
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

  await database
    .insertInto('node_user_states')
    .values(
      collaboratorIds.map((collaboratorId) => ({
        user_id: collaboratorId,
        node_id: event.id,
        last_seen_version_id: null,
        workspace_id: event.workspaceId,
        last_seen_at: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      })),
    )
    .onConflict((cb) => cb.doNothing())
    .execute();

  await publishChange(event.id, event.workspaceId, 'node_create');
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
    const descendants = await database
      .selectFrom('node_paths')
      .select('descendant_id')
      .where('ancestor_id', '=', event.id)
      .execute();

    const descendantIds = descendants.map((d) => d.descendant_id);
    const userStatesToCreated: CreateNodeUserState[] = [];
    for (const collaboratorId of addedCollaborators) {
      for (const descendantId of descendantIds) {
        userStatesToCreated.push({
          user_id: collaboratorId,
          node_id: descendantId,
          last_seen_version_id: null,
          workspace_id: event.workspaceId,
          last_seen_at: null,
          mentions_count: 0,
          created_at: new Date(),
          access_removed_at: null,
          version_id: generateId(IdType.Version),
        });
      }
    }

    if (userStatesToCreated.length > 0) {
      await database
        .insertInto('node_user_states')
        .values(userStatesToCreated)
        .onConflict((cb) => cb.doNothing())
        .execute();
    }
  }

  if (removedCollaborators.length > 0) {
    await database
      .updateTable('node_user_states')
      .set({
        access_removed_at: new Date(),
      })
      .where((eb) =>
        eb.and([
          eb('user_id', 'in', removedCollaborators),
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

  await publishChange(event.id, event.workspaceId, 'node_update');
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
  await publishChange(event.id, event.workspaceId, 'node_delete');
};

const publishChange = async (
  nodeId: string,
  workspaceId: string,
  type: 'node_create' | 'node_update' | 'node_delete',
): Promise<void> => {
  const changeJson = JSON.stringify({
    nodeId,
    workspaceId,
    type,
  });

  await redis.publish(CHANNEL_NAMES.CHANGES, changeJson);
};
