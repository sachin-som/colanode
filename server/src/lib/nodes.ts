import { database } from '@/data/database';
import { SelectNode } from '@/data/schema';
import { NodeCollaborator, ServerNode } from '@/types/nodes';

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

export const fetchCollaboratorRole = async (
  nodeId: string,
  collaboratorId: string,
): Promise<string | null> => {
  const result = await database
    .selectFrom('node_paths as np')
    .innerJoin('node_collaborators as nc', 'np.ancestor_id', 'nc.node_id')
    .select(['np.ancestor_id as node_id', 'np.level as node_level', 'nc.role'])
    .where('np.descendant_id', '=', nodeId)
    .where('nc.collaborator_id', '=', collaboratorId)
    .execute();

  if (result.length === 0) {
    return null;
  }

  const roleHierarchy = ['owner', 'admin', 'collaborator'];
  const highestRole = result.reduce((highest, row) => {
    const currentRoleIndex = roleHierarchy.indexOf(row.role);
    const highestRoleIndex = roleHierarchy.indexOf(highest);
    return currentRoleIndex < highestRoleIndex ? row.role : highest;
  }, 'collaborator');

  return highestRole;
};

export const fetchNodeAscendants = async (
  nodeId: string,
): Promise<string[]> => {
  const result = await database
    .selectFrom('node_paths')
    .select('ancestor_id')
    .where('descendant_id', '=', nodeId)
    .orderBy('level', 'desc')
    .execute();

  return result.map((row) => row.ancestor_id);
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
  const result = await database
    .selectFrom('node_paths as np')
    .innerJoin('node_collaborators as nc', 'np.ancestor_id', 'nc.node_id')
    .select([
      'np.ancestor_id as node_id',
      'np.level as node_level',
      'nc.collaborator_id',
      'nc.role',
    ])
    .where('np.descendant_id', '=', nodeId)
    .execute();

  return result.map((row) => ({
    nodeId: row.node_id,
    level: row.node_level,
    collaboratorId: row.collaborator_id,
    role: row.role,
  }));
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
