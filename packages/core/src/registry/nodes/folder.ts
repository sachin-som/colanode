import { z } from 'zod';

import { NodeModel } from './core';

import { NodeAttributes } from '.';

export const folderAttributesSchema = z.object({
  type: z.literal('folder'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
});

export type FolderAttributes = z.infer<typeof folderAttributesSchema>;

export const folderModel: NodeModel = {
  type: 'folder',
  attributesSchema: folderAttributesSchema,
  canCreate: async (context, _) => {
    return context.hasEditorAccess();
  },
  canUpdate: async (context, _) => {
    return context.hasEditorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasEditorAccess();
  },
  getName: function (
    _: string,
    attributes: NodeAttributes
  ): string | null | undefined {
    if (attributes.type !== 'folder') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
