import { z } from 'zod';

import { EntryModel, entryRoleEnum } from './core';

export const chatAttributesSchema = z.object({
  type: z.literal('chat'),
  parentId: z.string(),
  collaborators: z.record(z.string(), entryRoleEnum),
});

export type ChatAttributes = z.infer<typeof chatAttributesSchema>;

export const chatModel: EntryModel = {
  type: 'chat',
  schema: chatAttributesSchema,
  getText: () => {
    return undefined;
  },
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'chat') {
      return false;
    }

    const collaboratorIds = Object.keys(attributes.collaborators ?? {});
    if (collaboratorIds.length !== 2) {
      return false;
    }

    if (!collaboratorIds.includes(context.userId)) {
      return false;
    }

    return true;
  },
  canUpdate: async () => {
    return false;
  },
  canDelete: async () => {
    return false;
  },
};
