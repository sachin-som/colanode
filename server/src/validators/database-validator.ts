import { SelectWorkspaceUser } from '@/data/schema';
import { hasEditorAccess } from '@/lib/constants';
import { fetchNodeRole } from '@/lib/nodes';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';
import { Validator } from '@/types/validators';

export class DatabaseValidator implements Validator {
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

    return hasEditorAccess(role);
  }

  async canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    const role = await fetchNodeRole(node.id, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasEditorAccess(role);
  }

  async canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
  ): Promise<boolean> {
    const role = await fetchNodeRole(node.id, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasEditorAccess(role);
  }
}
