import { SelectNode } from '@/main/data/workspace/schema';
import { Node } from '@/registry';
import { generateKeyBetween } from 'fractional-indexing-jittered';
import { NodeTypes } from '@/lib/constants';

export const generateNodeIndex = (
  previous?: string | null,
  next?: string | null,
) => {
  const lower = previous === undefined ? null : previous;
  const upper = next === undefined ? null : next;

  return generateKeyBetween(lower, upper);
};

export const mapNode = (row: SelectNode): Node => {
  return {
    id: row.id,
    type: row.type as any,
    index: row.index,
    parentId: row.parent_id,
    attributes: JSON.parse(row.attributes),
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

export const getDefaultNodeIcon = (type: string) => {
  switch (type) {
    case NodeTypes.Channel:
      return 'discuss-line';
    case NodeTypes.Page:
      return 'book-line';
    case NodeTypes.Database:
      return 'database-2-line';
    case NodeTypes.Record:
      return 'article-line';
    case NodeTypes.Folder:
      return 'folder-open-line';
    case NodeTypes.Space:
      return 'team-line';
    default:
      return 'file-unknown-line';
  }
};
