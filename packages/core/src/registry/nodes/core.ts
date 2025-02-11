import { z, ZodSchema } from 'zod';

import { WorkspaceRole } from '../../types/workspaces';
import { hasNodeRole } from '../../lib/permissions';
import { extractNodeRole } from '../../lib/nodes';

import { Node, NodeAttributes } from '.';

export type NodeRole = 'admin' | 'editor' | 'commenter' | 'viewer';
export const nodeRoleEnum = z.enum(['admin', 'editor', 'commenter', 'viewer']);

export interface NodeMutationUser {
  id: string;
  role: WorkspaceRole;
  workspaceId: string;
  accountId: string;
}

export class NodeMutationContext {
  public readonly user: NodeMutationUser;
  public readonly root: Node | null;
  public readonly role: NodeRole | null;

  constructor(user: NodeMutationUser, root: Node | null) {
    this.user = user;
    this.root = root;
    this.role = root ? extractNodeRole(root, user.id) : null;
  }

  public hasAdminAccess = () => {
    return this.role ? hasNodeRole(this.role, 'admin') : false;
  };

  public hasEditorAccess = () => {
    return this.role ? hasNodeRole(this.role, 'editor') : false;
  };

  public hasCollaboratorAccess = () => {
    return this.role ? hasNodeRole(this.role, 'commenter') : false;
  };

  public hasViewerAccess = () => {
    return this.role ? hasNodeRole(this.role, 'viewer') : false;
  };
}

export interface NodeModel {
  type: string;
  attributesSchema: ZodSchema;
  documentSchema?: ZodSchema;
  canCreate: (
    context: NodeMutationContext,
    attributes: NodeAttributes
  ) => Promise<boolean>;
  canUpdate: (
    context: NodeMutationContext,
    node: Node,
    attributes: NodeAttributes
  ) => Promise<boolean>;
  canDelete: (context: NodeMutationContext, node: Node) => Promise<boolean>;
  getName: (
    id: string,
    attributes: NodeAttributes
  ) => string | null | undefined;
  getText: (
    id: string,
    attributes: NodeAttributes
  ) => string | null | undefined;
}
