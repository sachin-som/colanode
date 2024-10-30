import { database } from '@/data/database';
import { SelectWorkspaceUser } from '@/data/schema';
import { hasAdminAccess, NodeRoles, NodeTypes } from '@/lib/constants';
import { extractCollaborators, fetchNodeRole } from '@/lib/nodes';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';
import { Validator } from '@/types/validators';

export class ChannelValidator implements Validator {
  async canCreate(
    workspaceUser: SelectWorkspaceUser,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (!attributes.parentId) {
      return false;
    }

    const parent = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', attributes.parentId)
      .executeTakeFirst();

    if (!parent) {
      return false;
    }

    if (parent.type !== NodeTypes.Space) {
      return false;
    }

    const collaborators = extractCollaborators(parent);
    const role = collaborators[workspaceUser.id];
    if (role !== NodeRoles.Owner && role !== NodeRoles.Admin) {
      return false;
    }

    return true;
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
    const role = await fetchNodeRole(node.id, workspaceUser.id);
    if (!role) {
      return false;
    }

    return hasAdminAccess(role);
  }
}
