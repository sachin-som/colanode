import { SelectNode } from '@/data/schema';
import { ServerNode } from '@/types/nodes';

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
