import { SelectWorkspaceUser } from '@/data/schema';
import { hasOwnerAccess, NodeRoles } from '@/lib/constants';
import { extractCollaborators } from '@/lib/nodes';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';
import { Validator } from '@/types/validators';
import { WorkspaceRole } from '@/types/workspaces';

export class ChatValidator implements Validator {
  async canCreate(
    workspaceUser: SelectWorkspaceUser,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    if (workspaceUser.role === WorkspaceRole.Viewer) {
      return false;
    }

    const collaborators = extractCollaborators(attributes);
    if (collaborators[workspaceUser.id] !== NodeRoles.Owner) {
      return false;
    }

    return true;
  }

  async canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    const collaborators = extractCollaborators(attributes);
    const role = collaborators[workspaceUser.id];
    if (role !== NodeRoles.Owner && role !== NodeRoles.Admin) {
      return false;
    }

    return true;
  }

  async canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
  ): Promise<boolean> {
    const collaborators = extractCollaborators(node.attributes);
    const role = collaborators[workspaceUser.id];
    if (!role) {
      return false;
    }

    return hasOwnerAccess(role);
  }
}
