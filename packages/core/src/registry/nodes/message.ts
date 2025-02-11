import { z } from 'zod';

import { NodeModel } from './core';

import { blockSchema } from '../block';

import { NodeAttributes } from '.';

export const messageAttributesSchema = z.object({
  type: z.literal('message'),
  subtype: z.enum(['standard']),
  name: z.string().optional(),
  parentId: z.string(),
  referenceId: z.string().nullable().optional(),
  content: z.record(blockSchema).optional().nullable(),
});

export type MessageAttributes = z.infer<typeof messageAttributesSchema>;

export const messageModel: NodeModel = {
  type: 'message',
  attributesSchema: messageAttributesSchema,
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
    if (attributes.type !== 'message') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
