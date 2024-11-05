import { SelectWorkspaceUser } from '@/data/schema';
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

    const collaborators = attributes.collaborators ?? {};
    if (!collaborators[workspaceUser.id]) {
      return false;
    }

    return true;
  }

  async canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes,
  ): Promise<boolean> {
    return false;
  }

  async canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
  ): Promise<boolean> {
    return false;
  }
}
