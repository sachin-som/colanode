import { z } from 'zod';

import { fieldValueSchema } from './field-value';
import { NodeModel } from './core';

import { richTextContentSchema } from '../documents/rich-text';

import { NodeAttributes } from '.';

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
  canCreate: async (context, _) => {
    return context.hasCollaboratorAccess();
  },
  canUpdate: async (context, _) => {
    return context.hasCollaboratorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasCollaboratorAccess();
  },
  getName: function (
    _: string,
    attributes: NodeAttributes
  ): string | null | undefined {
    if (attributes.type !== 'record') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
