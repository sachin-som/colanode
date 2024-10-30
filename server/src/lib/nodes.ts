import { database } from '@/data/database';
import { SelectNode } from '@/data/schema';
import {
  NodeCollaborator,
  ServerNode,
  ServerNodeAttributes,
} from '@/types/nodes';

export const mapNode = (node: SelectNode): ServerNode => {
  return {
    id: node.id,
    parentId: node.parent_id,
    workspaceId: node.workspace_id,
    type: node.type,
    index: node.index,
    attributes: node.attributes,
    state: node.state,
    createdAt: node.created_at,
    createdBy: node.created_by,
    versionId: node.version_id,
    updatedAt: node.updated_at,
    updatedBy: node.updated_by,
    serverCreatedAt: node.server_created_at,
    serverUpdatedAt: node.server_updated_at,
  };
};

export const fetchNodeAncestors = async (
  nodeId: string,
): Promise<SelectNode[]> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .innerJoin('node_paths', 'nodes.id', 'node_paths.ancestor_id')
    .where('node_paths.descendant_id', '=', nodeId)
    .orderBy('node_paths.level', 'desc')
    .execute();

  return result;
};

export const fetchNodeDescendants = async (
  nodeId: string,
): Promise<string[]> => {
  const result = await database
    .selectFrom('node_paths')
    .select('descendant_id')
    .where('ancestor_id', '=', nodeId)
    .orderBy('level', 'asc')
    .execute();

  return result.map((row) => row.descendant_id);
};

export const fetchNodeCollaborators = async (
  nodeId: string,
): Promise<NodeCollaborator[]> => {
  const ancestors = await fetchNodeAncestors(nodeId);
  const collaboratorsMap = new Map<string, string>();

  for (const ancestor of ancestors) {
    const collaborators = extractCollaborators(ancestor.attributes);
    for (const [collaboratorId, role] of Object.entries(collaborators)) {
      collaboratorsMap.set(collaboratorId, role);
    }
  }

  return Array.from(collaboratorsMap.entries()).map(
    ([collaboratorId, role]) => ({
      nodeId: nodeId,
      collaboratorId: collaboratorId,
      role: role,
    }),
  );
};

export const fetchNodeRole = async (
  nodeId: string,
  collaboratorId: string,
): Promise<string | null> => {
  const ancestors = await fetchNodeAncestors(nodeId);
  if (ancestors.length === 0) {
    return null;
  }

  let role: string | null = null;
  for (const ancestor of ancestors) {
    const collaborators = extractCollaborators(ancestor.attributes);
    const collaboratorRole = collaborators[collaboratorId];
    if (collaboratorRole) {
      role = collaboratorRole;
    }
  }

  return role;
};

export const fetchWorkspaceUsers = async (
  workspaceId: string,
): Promise<string[]> => {
  const result = await database
    .selectFrom('workspace_users')
    .select('id')
    .where('workspace_id', '=', workspaceId)
    .execute();

  return result.map((row) => row.id);
};

export const extractCollaborators = (
  attribues: ServerNodeAttributes,
): Record<string, string> => {
  return attribues.collaborators ?? {};
};
