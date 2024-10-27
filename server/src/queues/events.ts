import { database } from '@/data/database';
import { CHANNEL_NAMES, redis, redisConfig } from '@/data/redis';
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
import { difference } from 'lodash';

const eventQueue = new Queue('events', {
  connection: {
    host: redisConfig.host,
    password: redisConfig.password,
    port: redisConfig.port,
    db: redisConfig.db,
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
      host: redisConfig.host,
      password: redisConfig.password,
      port: redisConfig.port,
      db: redisConfig.db,
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
  if (event.attributes.type === NodeTypes.User) {
    const userIds = await fetchWorkspaceUsers(event.workspaceId);
    const userStatesToCreate: CreateNodeUserState[] = [];

    for (const userId of userIds) {
      userStatesToCreate.push({
        user_id: userId,
        node_id: event.id,
        last_seen_version_id: null,
        workspace_id: event.workspaceId,
        last_seen_at: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });

      if (userId === event.id) {
        continue;
      }

      userStatesToCreate.push({
        user_id: event.id,
        node_id: userId,
        last_seen_version_id: null,
        workspace_id: event.workspaceId,
        last_seen_at: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });
    }

    if (userStatesToCreate.length > 0) {
      await database
        .insertInto('node_user_states')
        .values(userStatesToCreate)
        .onConflict((cb) => cb.doNothing())
        .execute();
    }
  } else {
    const collaborators = await fetchNodeCollaborators(event.id);
    const collaboratorIds = collaborators.map((c) => c.collaboratorId);

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
  }

  await publishChange(event.id, event.workspaceId, 'node_create');
};

const handleNodeUpdatedEvent = async (
  event: NodeUpdatedEvent,
): Promise<void> => {
  await checkForCollaboratorsChange(event);
  await publishChange(event.id, event.workspaceId, 'node_update');
};

const checkForCollaboratorsChange = async (
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

  if (addedCollaborators.length === 0 && removedCollaborators.length === 0) {
    return;
  }

  if (addedCollaborators.length > 0) {
    const existingNodeUserStates = await database
      .selectFrom('node_user_states')
      .select('user_id')
      .where('node_id', '=', event.id)
      .where('user_id', 'in', addedCollaborators)
      .execute();

    const existingCollaboratorIds = existingNodeUserStates.map(
      (e) => e.user_id,
    );

    const actualAddedCollaborators = difference(
      addedCollaborators,
      existingCollaboratorIds,
    );

    if (actualAddedCollaborators.length > 0) {
      const descendants = await database
        .selectFrom('node_paths')
        .select('descendant_id')
        .where('ancestor_id', '=', event.id)
        .execute();

      const descendantIds = descendants.map((d) => d.descendant_id);
      const userStatesToCreate: CreateNodeUserState[] = [];
      for (const collaboratorId of addedCollaborators) {
        for (const descendantId of descendantIds) {
          userStatesToCreate.push({
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

      if (userStatesToCreate.length > 0) {
        await database
          .insertInto('node_user_states')
          .values(userStatesToCreate)
          .onConflict((cb) => cb.doNothing())
          .execute();
      }
    }
  }

  if (removedCollaborators.length > 0) {
    const nodeCollaborators = await fetchNodeCollaborators(event.id);
    const nodeCollaboratorIds = nodeCollaborators.map((c) => c.collaboratorId);
    const actualRemovedCollaborators = difference(
      removedCollaborators,
      nodeCollaboratorIds,
    );

    if (actualRemovedCollaborators.length > 0) {
      const descendants = await database
        .selectFrom('node_paths')
        .select('descendant_id')
        .where('ancestor_id', '=', event.id)
        .execute();

      const descendantIds = descendants.map((d) => d.descendant_id);
      await database
        .updateTable('node_user_states')
        .set({
          access_removed_at: new Date(),
        })
        .where('user_id', 'in', actualRemovedCollaborators)
        .where('node_id', 'in', descendantIds)
        .execute();
    }
  }
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
