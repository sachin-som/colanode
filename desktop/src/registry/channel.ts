import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';

export const channelAttributesSchema = z.object({
  type: z.literal('channel'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  index: z.string(),
  collaborators: z.record(z.string()).nullable().optional(),
});

export type ChannelAttributes = z.infer<typeof channelAttributesSchema>;

export const ChannelRegistry: NodeRegistry = {
  type: 'channel',
  schema: channelAttributesSchema,
};
