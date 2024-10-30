import { SelectWorkspaceUser } from '@/data/schema';
import { hasAdminAccess, hasCollaboratorAccess } from '@/lib/constants';
import { fetchNodeRole } from '@/lib/nodes';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';
import { Validator } from '@/types/validators';
import { isEqual } from 'lodash';

export class MessageValidator implements Validator {
  async canCreate(
    workspaceUser: SelectWorkspaceUser,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (!attributes.parentId) {
      return false;
    }

    const parentId = attributes.parentId;
    const role = await fetchNodeRole(parentId, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasCollaboratorAccess(role);
  }

  async canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (!attributes.parentId || attributes.parentId !== node.parentId) {
      return false;
    }

    if (
      !isEqual(attributes.content, node.attributes.content) &&
      node.createdBy !== workspaceUser.id
    ) {
      return false;
    }

    const role = await fetchNodeRole(node.id, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasCollaboratorAccess(role);
  }

  async canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
  ): Promise<boolean> {
    if (node.createdBy === workspaceUser.id) {
      return true;
    }

    const role = await fetchNodeRole(node.id, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasAdminAccess(role);
  }
}
