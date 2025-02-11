import { z } from 'zod';

import { fieldAttributesSchema } from './field';
import { NodeModel } from './core';

import { NodeAttributes } from '.';

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
    if (attributes.type !== 'database') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
