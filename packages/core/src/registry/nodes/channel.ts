import { z } from 'zod';

import { NodeModel } from './core';

import { NodeAttributes } from '.';

export const channelAttributesSchema = z.object({
  type: z.literal('channel'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
});

export type ChannelAttributes = z.infer<typeof channelAttributesSchema>;

export const channelModel: NodeModel = {
  type: 'channel',
  attributesSchema: channelAttributesSchema,
  canCreate: async (context, _) => {
    return context.hasEditorAccess();
  },
  canUpdate: async (context, _) => {
    return context.hasEditorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasAdminAccess();
  },
  getName: function (
    _: string,
    attributes: NodeAttributes
  ): string | null | undefined {
    if (attributes.type !== 'channel') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
