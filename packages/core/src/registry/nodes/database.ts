import { z } from 'zod';

import { fieldAttributesSchema } from './field';
import { NodeModel } from './core';

import { extractNodeRole } from '../../lib/nodes';
import { hasNodeRole } from '../../lib/permissions';

export const databaseAttributesSchema = z.object({
  type: z.literal('database'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  fields: z.record(z.string(), fieldAttributesSchema),
});

export type DatabaseAttributes = z.infer<typeof databaseAttributesSchema>;

export const databaseModel: NodeModel = {
  type: 'database',
  attributesSchema: databaseAttributesSchema,
  canCreate: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateAttributes: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canUpdateDocument: () => {
    return false;
  },
  canDelete: (context) => {
    if (context.tree.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.tree, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'editor');
  },
  canReact: () => {
    return false;
  },
  extractText: (_, attributes) => {
    if (attributes.type !== 'database') {
      throw new Error('Invalid node type');
    }

    return {
      name: attributes.name,
      attributes: null,
    };
  },
  extractMentions: () => {
    return [];
  },
};
