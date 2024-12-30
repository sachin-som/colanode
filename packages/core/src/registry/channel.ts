import { z } from 'zod';

export const channelAttributesSchema = z.object({
  type: z.literal('channel'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
});

export type ChannelAttributes = z.infer<typeof channelAttributesSchema>;
