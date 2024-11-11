import { ZodSchema } from 'zod';
import { Node, NodeAttributes } from './';
import { extractNodeRole } from '../lib/nodes';
import { WorkspaceRole } from '../types/workspaces';

export type NodeRole = 'admin' | 'editor' | 'collaborator' | 'viewer';

export class NodeMutationContext {
  public accountId: string;
  public workspaceId: string;
  public userId: string;
  public ancestors: Node[];
  public nodeRole: NodeRole | null;
  public workspaceRole: WorkspaceRole | null;

  constructor(
    accountId: string,
    workspaceId: string,
    userId: string,
    workspaceRole: WorkspaceRole | null,
    ancestors: Node[]
  ) {
    this.accountId = accountId;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.workspaceRole = workspaceRole;
    this.ancestors = ancestors;
    this.nodeRole = extractNodeRole(ancestors, userId);
  }

  public hasAdminAccess = () => {
    return this.nodeRole === 'admin';
  };

  public hasEditorAccess = () => {
    return this.nodeRole === 'admin' || this.nodeRole === 'editor';
  };

  public hasCollaboratorAccess = () => {
    return (
      this.nodeRole === 'admin' ||
      this.nodeRole === 'editor' ||
      this.nodeRole === 'collaborator'
    );
  };

  public hasViewerAccess = () => {
    return (
      this.nodeRole === 'admin' ||
      this.nodeRole === 'editor' ||
      this.nodeRole === 'collaborator' ||
      this.nodeRole === 'viewer'
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
