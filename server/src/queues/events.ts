import { database } from '@/data/database';
import { redisConfig } from '@/data/redis';
import { CreateUserNode } from '@/data/schema';
import { filesStorage } from '@/data/storage';
import { BUCKET_NAMES } from '@/data/storage';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { fetchNodeCollaborators, fetchWorkspaceUsers } from '@/lib/nodes';
import { synapse } from '@/services/synapse';
import {
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeEvent,
  NodeUpdatedEvent,
} from '@/types/events';
import { ServerNodeAttributes } from '@/types/nodes';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
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
  await createUserNodes(event);
  await synapse.sendSynapseMessage({
    type: 'node_create',
    nodeId: event.id,
    workspaceId: event.workspaceId,
  });
};

const handleNodeUpdatedEvent = async (
  event: NodeUpdatedEvent,
): Promise<void> => {
  await checkForCollaboratorsChange(event);
  await synapse.sendSynapseMessage({
    type: 'node_update',
    nodeId: event.id,
    workspaceId: event.workspaceId,
  });
};

const handleNodeDeletedEvent = async (
  event: NodeDeletedEvent,
): Promise<void> => {
  if (event.attributes.type === NodeTypes.File) {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAMES.FILES,
      Key: `files/${event.id}${event.attributes.extension}`,
    });

    await filesStorage.send(command);
  }

  await synapse.sendSynapseMessage({
    type: 'node_delete',
    nodeId: event.id,
    workspaceId: event.workspaceId,
  });
};

const createUserNodes = async (event: NodeCreatedEvent): Promise<void> => {
  const userNodesToCreate: CreateUserNode[] = [];
  if (event.attributes.type === NodeTypes.User) {
    const userIds = await fetchWorkspaceUsers(event.workspaceId);

    for (const userId of userIds) {
      userNodesToCreate.push({
        user_id: userId,
        node_id: event.id,
        workspace_id: event.workspaceId,
        last_seen_at: null,
        last_seen_version_id: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });

      if (userId === event.id) {
        continue;
      }

      userNodesToCreate.push({
        user_id: event.id,
        node_id: userId,
        workspace_id: event.workspaceId,
        last_seen_version_id: null,
        last_seen_at: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });
    }
  } else {
    const collaborators = await fetchNodeCollaborators(event.id);
    const collaboratorIds = collaborators.map((c) => c.collaboratorId);

    for (const collaboratorId of collaboratorIds) {
      userNodesToCreate.push({
        user_id: collaboratorId,
        node_id: event.id,
        workspace_id: event.workspaceId,
        last_seen_at:
          collaboratorId === event.createdBy ? new Date(event.createdAt) : null,
        last_seen_version_id:
          collaboratorId === event.createdBy ? event.versionId : null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });
    }
  }

  if (userNodesToCreate.length > 0) {
    await database
      .insertInto('user_nodes')
      .values(userNodesToCreate)
      .onConflict((cb) => cb.doNothing())
      .execute();
  }
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
    const existingUserNodes = await database
      .selectFrom('user_nodes')
      .select('user_id')
      .where('node_id', '=', event.id)
      .where('user_id', 'in', addedCollaborators)
      .execute();

    const existingCollaboratorIds = existingUserNodes.map((e) => e.user_id);

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
      const userNodesToCreate: CreateUserNode[] = [];
      for (const collaboratorId of addedCollaborators) {
        for (const descendantId of descendantIds) {
          userNodesToCreate.push({
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

      if (userNodesToCreate.length > 0) {
        await database
          .insertInto('user_nodes')
          .values(userNodesToCreate)
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
        .updateTable('user_nodes')
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
