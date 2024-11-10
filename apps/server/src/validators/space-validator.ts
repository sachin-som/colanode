import { SelectWorkspaceUser } from '@/data/schema';
import { hasAdminAccess, hasEditorAccess } from '@/lib/constants';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';
import { Validator } from '@/types/validators';
import { WorkspaceRole } from '@/types/workspaces';

export class SpaceValidator implements Validator {
  async canCreate(
    workspaceUser: SelectWorkspaceUser,
    attributes: ServerNodeAttributes
  ): Promise<boolean> {
    if (workspaceUser.role === WorkspaceRole.Viewer) {
      return false;
    }

    const collaborators = attributes.collaborators ?? {};
    const role = collaborators[workspaceUser.id];

    return hasAdminAccess(role);
  }

  async canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes
  ): Promise<boolean> {
    const collaborators = attributes.collaborators ?? {};
    const role = collaborators[workspaceUser.id];
    if (!role) {
      return false;
    }

    return hasEditorAccess(role);
  }

  async canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode
  ): Promise<boolean> {
    const collaborators = node.attributes.collaborators ?? {};
    const role = collaborators[workspaceUser.id];
    if (!role) {
      return false;
    }

    return hasAdminAccess(role);
  }
}
