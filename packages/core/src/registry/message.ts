import { z } from 'zod';

import { blockSchema } from './block';

export const messageAttributesSchema = z.object({
  type: z.literal('message'),
  subtype: z.enum(['standard']),
  name: z.string().optional(),
  parentId: z.string(),
  referenceId: z.string().nullable().optional(),
  content: z.record(blockSchema).optional().nullable(),
});

export type MessageAttributes = z.infer<typeof messageAttributesSchema>;
