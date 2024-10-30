import { SelectWorkspaceUser } from '@/data/schema';
import { ServerNode, ServerNodeAttributes } from '@/types/nodes';

export interface Validator {
  canCreate(
    workspaceUser: SelectWorkspaceUser,
    attributes: ServerNodeAttributes,
  ): Promise<boolean>;

  canUpdate(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
    attributes: ServerNodeAttributes,
  ): Promise<boolean>;

  canDelete(
    workspaceUser: SelectWorkspaceUser,
    node: ServerNode,
  ): Promise<boolean>;
}
