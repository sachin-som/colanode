import { NodesTableSchema } from '@/data/schemas/workspace';
import { Node, NodeWithChildren } from '@/types/nodes';
import { generateKeyBetween } from 'fractional-indexing-jittered';

export const buildNodeWithChildren = (
  node: Node,
  allNodes: Node[],
): NodeWithChildren => {
  const children: NodeWithChildren[] = allNodes
    .filter((n) => n.parentId === node.id)
    .map((n) => buildNodeWithChildren(n, allNodes));

  return {
    ...node,
    children: children,
  };
};

export const generateNodeIndex = (before?: string | null, after?: string | null) => {
  const lower = before === undefined ? null : before;
  const upper = after === undefined ? null : after;

  return generateKeyBetween(lower, upper);
}

export const mapNode = (row: NodesTableSchema): Node => {
  return {
    id: row.id,
    type: row.type,
    index: row.index,
    parentId: row.parent_id,
    workspaceId: row.workspace_id,
    attrs: row.attrs && JSON.parse(row.attrs),
    content: row.content && JSON.parse(row.content),
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    updatedBy: row.updated_by,
    versionId: row.version_id,
    serverCreatedAt: row.server_created_at
      ? new Date(row.server_created_at)
      : null,
    serverUpdatedAt: row.server_updated_at
      ? new Date(row.server_updated_at)
      : null,
  };
}