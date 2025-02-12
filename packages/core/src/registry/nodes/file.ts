import { z } from 'zod';

import { NodeModel } from './core';

import { extractNodeRole } from '../../lib/nodes';
import { hasNodeRole } from '../../lib/permissions';

export const fileAttributesSchema = z.object({
  type: z.literal('file'),
  name: z.string().optional(),
  parentId: z.string(),
  index: z.string().optional(),
});

export type FileAttributes = z.infer<typeof fileAttributesSchema>;

export const fileModel: NodeModel = {
  type: 'file',
  attributesSchema: fileAttributesSchema,
  canCreate: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    const parent = context.ancestors[context.ancestors.length - 1]!;
    if (parent.type === 'message') {
      return hasNodeRole(role, 'collaborator');
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateAttributes: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    const parent = context.ancestors[context.ancestors.length - 1]!;
    if (parent.type === 'message') {
      return parent.createdBy === context.user.id || hasNodeRole(role, 'admin');
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateDocument: () => {
    return false;
  },
  canDelete: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    const parent = context.ancestors[context.ancestors.length - 1]!;
    if (parent.type === 'message') {
      return parent.createdBy === context.user.id || hasNodeRole(role, 'admin');
    }

    return hasNodeRole(role, 'editor');
  },
  getName: (_, attributes) => {
    if (attributes.type !== 'file') {
      return null;
    }

    return attributes.name;
  },
  getAttributesText: () => {
    return undefined;
  },
  getDocumentText: () => {
    return undefined;
  },
};
