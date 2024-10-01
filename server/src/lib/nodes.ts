import { database } from '@/data/database';
import { SelectNode } from '@/data/schema';
import { ServerNode } from '@/types/nodes';
import { sql } from 'kysely';

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

type NodeCollaboratorRow = {
  node_id: string;
  node_level: number;
  role: string;
};

export const getCollaboratorRole = async (
  nodeId: string,
  collaboratorId: string,
): Promise<string | null> => {
  const query = sql<NodeCollaboratorRow>`
    WITH RECURSIVE ancestors(id, parent_id, level) AS (
      SELECT id, parent_id, 0 AS level
      FROM nodes
      WHERE id = ${nodeId}
      UNION ALL
      SELECT n.id, n.parent_id, a.level + 1
      FROM nodes n
      INNER JOIN ancestors a ON n.id = a.parent_id
    )
    SELECT
      nc.node_id,
      a.level AS node_level,
      nc.role
    FROM node_collaborators nc
    JOIN ancestors a ON nc.node_id = a.id
    WHERE nc.collaborator_id = ${collaboratorId};
  `.compile(database);

  const result = await database.executeQuery(query);
  if (result.rows.length === 0) {
    return null;
  }

  const roleHierarchy = ['owner', 'admin', 'collaborator'];
  const highestRole = result.rows.reduce((highest, row) => {
    const currentRoleIndex = roleHierarchy.indexOf(row.role);
    const highestRoleIndex = roleHierarchy.indexOf(highest);
    return currentRoleIndex < highestRoleIndex ? row.role : highest;
  }, 'collaborator');

  return highestRole;
};
