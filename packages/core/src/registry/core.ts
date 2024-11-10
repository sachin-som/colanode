import { ZodSchema } from 'zod';
import { Node, NodeAttributes } from './';
import { extractNodeRole } from '../lib/nodes';

export type NodeRole = 'admin' | 'editor' | 'collaborator' | 'viewer';

export class NodeMutationContext {
  public accountId: string;
  public workspaceId: string;
  public userId: string;
  public ancestors: Node[];
  public role: NodeRole | null;

  constructor(
    accountId: string,
    workspaceId: string,
    userId: string,
    ancestors: Node[]
  ) {
    this.accountId = accountId;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.ancestors = ancestors;
    this.role = extractNodeRole(ancestors, userId);
  }

  public hasAdminAccess = () => {
    return this.role === 'admin';
  };

  public hasEditorAccess = () => {
    return this.role === 'admin' || this.role === 'editor';
  };

  public hasCollaboratorAccess = () => {
    return (
      this.role === 'admin' ||
      this.role === 'editor' ||
      this.role === 'collaborator'
    );
  };

  public hasViewerAccess = () => {
    return (
      this.role === 'admin' ||
      this.role === 'editor' ||
      this.role === 'collaborator' ||
      this.role === 'viewer'
    );
  };
}

export interface NodeModel {
  type: string;
  schema: ZodSchema;
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
}
