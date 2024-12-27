import { isEqual } from 'lodash-es';
import { z } from 'zod';

import { blockSchema } from './block';
import { EntryModel, entryRoleEnum } from './core';

import { extractText } from '../lib/blocks';

export const pageAttributesSchema = z.object({
  type: z.literal('page'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  content: z.record(blockSchema),
  collaborators: z.record(z.string(), entryRoleEnum).nullable().optional(),
});

export type PageAttributes = z.infer<typeof pageAttributesSchema>;

export const pageModel: EntryModel = {
  type: 'page',
  schema: pageAttributesSchema,
  getText: (id, attributes) => {
    if (attributes.type !== 'page') {
      return undefined;
    }

    return {
      id,
      name: attributes.name,
      text: extractText(id, attributes.content),
    };
  },
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'page') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length > 0 && !context.hasAdminAccess()) {
      return false;
    }

    return context.hasEditorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'page' || node.type !== 'page') {
      return false;
    }

    if (!isEqual(attributes.collaborators, node.attributes.collaborators)) {
      return context.hasAdminAccess();
    }

    return context.hasEditorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasEditorAccess();
  },
};
