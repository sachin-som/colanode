import { z } from 'zod';

import { NodeModel } from './core';

import { NodeAttributes } from '.';

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
    if (attributes.type !== 'file') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
