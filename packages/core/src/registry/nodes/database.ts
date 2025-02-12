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

    return hasNodeRole(role, 'editor');
  },
  getName: (_, attributes) => {
    if (attributes.type !== 'database') {
      return undefined;
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
