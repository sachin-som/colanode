import { SelectWorkspaceUser } from '@/data/schema';
import { hasAdminAccess } from '@/lib/constants';
import { fetchNodeRole } from '@/lib/nodes';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';
import { Validator } from '@/types/validators';

export class FieldValidator implements Validator {
  async canCreate(
    workspaceUser: SelectWorkspaceUser,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (!attributes.parentId) {
      return false;
    }

    const role = await fetchNodeRole(attributes.parentId, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasAdminAccess(role);
  }

  async canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (!attributes.parentId || attributes.parentId !== node.parentId) {
      return false;
    }

    const role = await fetchNodeRole(node.id, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasAdminAccess(role);
  }

  async canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
  ): Promise<boolean> {
    if (!node.parentId) {
      return false;
    }

    const role = await fetchNodeRole(node.parentId, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasAdminAccess(role);
  }
}
