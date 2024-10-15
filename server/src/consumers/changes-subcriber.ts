import { database } from '@/data/database';
import { redis, CHANNEL_NAMES } from '@/data/redis';
import { SelectNode } from '@/data/schema';
import { NodeTypes } from '@/lib/constants';
import { socketManager } from '@/sockets/socket-manager';
import { ServerNodeChangeEvent, ServerNodeSyncData } from '@/types/sync';

export const initChangesSubscriber = async () => {
  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.subscribe(CHANNEL_NAMES.CHANGES, handleEvent);
};

const handleEvent = async (event: string) => {
  const data: ServerNodeChangeEvent = JSON.parse(event);

  let hasWorkspaceConnection = false;
  for (const connection of socketManager.getConnections()) {
    const workspaces = connection.getWorkspaces();
    if (workspaces.has(data.workspaceId)) {
      hasWorkspaceConnection = true;
      break;
    }
  }

  if (!hasWorkspaceConnection) {
    return;
  }

  const node = await database
    .selectFrom('nodes')
    .where('id', '=', data.nodeId)
    .selectAll()
    .executeTakeFirst();

  if (!node) {
    return;
  }

  const ancestorIds = await fetchAncestors(node);
  const collaborators = extractCollaborators(node);
  const nodeSync: ServerNodeSyncData = {
    id: node.id,
    workspaceId: node.workspace_id,
    state: node.state,
    createdAt: node.created_at.toISOString(),
    updatedAt: node.updated_at?.toISOString(),
    createdBy: node.created_by,
    updatedBy: node.updated_by,
    deletedAt: node.deleted_at?.toISOString(),
    deletedBy: node.deleted_by,
    versionId: node.version_id,
    serverCreatedAt: node.server_created_at.toISOString(),
    serverUpdatedAt: node.server_updated_at?.toISOString(),
    serverDeletedAt: node.server_deleted_at?.toISOString(),
  };

  for (const connection of socketManager.getConnections()) {
    const workspaces = connection.getWorkspaces();
    if (!workspaces.has(data.workspaceId)) {
      continue;
    }

    const workspaceUser = workspaces.get(data.workspaceId);
    if (!workspaceUser) {
      continue;
    }

    const isCollaborator = collaborators.includes(workspaceUser.userId);
    const shouldSend =
      node.type === NodeTypes.User ||
      isCollaborator ||
      ancestorIds.some((id) => workspaceUser.nodeIds.includes(id));

    if (shouldSend) {
      connection.send({
        type: 'server_nodes_sync',
        nodes: [nodeSync],
      });
    }

    if (isCollaborator) {
      workspaceUser.nodeIds.push(node.id);
    } else if (workspaceUser.nodeIds.includes(node.id)) {
      workspaceUser.nodeIds = workspaceUser.nodeIds.filter(
        (id) => id !== node.id,
      );
    }
  }
};

const fetchAncestors = async (node: SelectNode): Promise<string[]> => {
  if (node.type === NodeTypes.User || node.type === NodeTypes.Space) {
    return [];
  }

  const ancestors = await database
    .selectFrom('node_paths')
    .where('descendant_id', '=', node.id)
    .select(['ancestor_id'])
    .execute();

  if (!ancestors) {
    return [];
  }

  const ancestorIds = ancestors.map((ancestor) => ancestor.ancestor_id);
  return ancestorIds;
};

const extractCollaborators = (node: SelectNode): string[] => {
  if (!node.attributes || !node.attributes.collaborators) {
    return [];
  }

  return Object.keys(node.attributes.collaborators);
};
