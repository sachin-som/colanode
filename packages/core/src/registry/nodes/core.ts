import { z, ZodSchema } from 'zod';

import { WorkspaceRole } from '../../types/workspaces';
import { DocumentContent } from '../documents';

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

export interface NodeModel {
  type: string;
  attributesSchema: ZodSchema;
  documentSchema?: ZodSchema;
  canCreate: (context: CanCreateNodeContext) => boolean;
  canUpdateAttributes: (context: CanUpdateAttributesContext) => boolean;
  canUpdateDocument: (context: CanUpdateDocumentContext) => boolean;
  canDelete: (context: CanDeleteNodeContext) => boolean;
  getName: (
    id: string,
    attributes: NodeAttributes
  ) => string | null | undefined;
  getAttributesText: (
    id: string,
    attributes: NodeAttributes
  ) => string | null | undefined;
  getDocumentText: (
    id: string,
    content: DocumentContent
  ) => string | null | undefined;
}
