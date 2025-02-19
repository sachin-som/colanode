import { z, ZodSchema } from 'zod';

import { WorkspaceRole } from '../../types/workspaces';

import { Node, NodeAttributes } from '.';

export type NodeRole = 'admin' | 'editor' | 'collaborator' | 'viewer';
export const nodeRoleEnum = z.enum([
  'admin',
  'editor',
  'collaborator',
  'viewer',
]);

export interface NodeMutationUser {
  id: string;
  role: WorkspaceRole;
  workspaceId: string;
  accountId: string;
}

export type CanCreateNodeContext = {
  user: NodeMutationUser;
  tree: Node[];
  attributes: NodeAttributes;
};

export type CanUpdateAttributesContext = {
  user: NodeMutationUser;
  tree: Node[];
  node: Node;
  attributes: NodeAttributes;
};

export type CanUpdateDocumentContext = {
  user: NodeMutationUser;
  tree: Node[];
  node: Node;
};

export type CanDeleteNodeContext = {
  user: NodeMutationUser;
  tree: Node[];
  node: Node;
};

export interface CanReactNodeContext {
  user: NodeMutationUser;
  tree: Node[];
  node: Node;
}

export type NodeText = {
  name: string | null | undefined;
  attributes: string | null | undefined;
};

export interface NodeModel {
  type: string;
  attributesSchema: ZodSchema;
  documentSchema?: ZodSchema;
  canCreate: (context: CanCreateNodeContext) => boolean;
  canUpdateAttributes: (context: CanUpdateAttributesContext) => boolean;
  canUpdateDocument: (context: CanUpdateDocumentContext) => boolean;
  canDelete: (context: CanDeleteNodeContext) => boolean;
  canReact: (context: CanReactNodeContext) => boolean;
  extractNodeText: (id: string, attributes: NodeAttributes) => NodeText | null;
}
