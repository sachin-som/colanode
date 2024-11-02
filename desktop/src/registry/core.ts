import { ZodSchema } from 'zod';
import { Node, NodeAttributes } from '@/registry';

export type NodeRole = 'admin' | 'editor' | 'collaborator' | 'viewer';

export interface NodeMutationContext {
  accountId: string;
  workspaceId: string;
  userId: string;
  ancestors: Node[];
  role: NodeRole;
  hasAdminAccess: () => boolean;
  hasEditorAccess: () => boolean;
  hasCollaboratorAccess: () => boolean;
  hasViewerAccess: () => boolean;
}

export interface NodeModel {
  type: string;
  schema: ZodSchema;
  canCreate: (
    context: NodeMutationContext,
    attributes: NodeAttributes,
  ) => Promise<boolean>;
  canUpdate: (
    context: NodeMutationContext,
    node: Node,
    attributes: NodeAttributes,
  ) => Promise<boolean>;
  canDelete: (context: NodeMutationContext, node: Node) => Promise<boolean>;
}
