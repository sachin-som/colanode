import { SelectNode } from '@/data/schemas/workspace';
import { LocalNode, LocalNodeWithChildren } from '@/types/nodes';
import { generateKeyBetween } from 'fractional-indexing-jittered';

export const buildNodeWithChildren = (
  node: LocalNode,
  allNodes: LocalNode[],
): LocalNodeWithChildren => {
  const children: LocalNodeWithChildren[] = allNodes
    .filter((n) => n.parentId === node.id)
    .map((n) => buildNodeWithChildren(n, allNodes));

  return {
    ...node,
    children: children,
  };
};

export const generateNodeIndex = (
  before?: string | null,
  after?: string | null,
) => {
  const lower = before === undefined ? null : before;
  const upper = after === undefined ? null : after;

  return generateKeyBetween(lower, upper);
};

export const mapNode = (row: SelectNode): LocalNode => {
  return {
    id: row.id,
    type: row.type,
    index: row.index,
    parentId: row.parent_id,
    attrs: row.attrs ? JSON.parse(row.attrs) : null,
    content: row.content ? JSON.parse(row.content) : null,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    versionId: row.version_id,
    serverCreatedAt: row.server_created_at,
    serverUpdatedAt: row.server_updated_at,
    serverVersionId: row.server_version_id,
  };
};

export const compareNodeIndex = (a: LocalNode, b: LocalNode): number => {
  if (a.index < b.index) {
    return -1;
  } else if (a.index > b.index) {
    return 1;
  }

  return 0;
};

export const compareNodeId = (a: LocalNode, b: LocalNode): number => {
  if (a.id < b.id) {
    return -1;
  } else if (a.id > b.id) {
    return 1;
  }

  return 0;
};
