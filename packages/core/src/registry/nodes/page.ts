import { z } from 'zod';

import { NodeModel } from './core';

import { richTextContentSchema } from '../documents/rich-text';
import { extractNodeRole } from '../../lib/nodes';
import { hasNodeRole } from '../../lib/permissions';

export const pageAttributesSchema = z.object({
  type: z.literal('page'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
});

export type PageAttributes = z.infer<typeof pageAttributesSchema>;

export const pageModel: NodeModel = {
  type: 'page',
  attributesSchema: pageAttributesSchema,
  documentSchema: richTextContentSchema,
  canCreate: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
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

    return hasNodeRole(role, 'editor');
  },
  canUpdateDocument: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canDelete: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'admin');
  },
  getName: (_, attributes) => {
    if (attributes.type !== 'page') {
      return undefined;
    }

    return attributes.name;
  },
  getAttributesText: (id, attributes) => {
    if (attributes.type !== 'page') {
      return undefined;
    }

    return attributes.name;
  },
  getDocumentText: () => {
    return undefined;
  },
};
