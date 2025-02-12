import { z } from 'zod';

import { fieldValueSchema } from './field-value';
import { NodeModel } from './core';

import { richTextContentSchema } from '../documents/rich-text';
import { extractNodeRole } from '../../lib/nodes';
import { hasNodeRole } from '../../lib/permissions';

export const recordAttributesSchema = z.object({
  type: z.literal('record'),
  parentId: z.string(),
  databaseId: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  fields: z.record(z.string(), fieldValueSchema),
});

export type RecordAttributes = z.infer<typeof recordAttributesSchema>;

export const recordModel: NodeModel = {
  type: 'record',
  attributesSchema: recordAttributesSchema,
  documentSchema: richTextContentSchema,
  canCreate: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    return hasNodeRole(role, 'collaborator');
  },
  canUpdateAttributes: (context) => {
    if (context.ancestors.length === 0) {
      return false;
    }

    const role = extractNodeRole(context.ancestors, context.user.id);
    if (!role) {
      return false;
    }

    if (context.node.createdBy === context.user.id) {
      return true;
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

    if (context.node.createdBy === context.user.id) {
      return true;
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

    if (context.node.createdBy === context.user.id) {
      return true;
    }

    return hasNodeRole(role, 'admin');
  },
  getName: (_, attributes) => {
    if (attributes.type !== 'record') {
      return undefined;
    }

    return attributes.name;
  },
  getAttributesText: (id, attributes) => {
    if (attributes.type !== 'record') {
      return undefined;
    }

    return attributes.name;
  },
  getDocumentText: () => {
    return undefined;
  },
};
