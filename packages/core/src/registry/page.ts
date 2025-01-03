import { z } from 'zod';

import { blockSchema } from './block';

export const pageAttributesSchema = z.object({
  type: z.literal('page'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  content: z.record(blockSchema),
});

export type PageAttributes = z.infer<typeof pageAttributesSchema>;
