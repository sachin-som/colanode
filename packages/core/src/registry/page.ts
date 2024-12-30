import { z } from 'zod';

import { blockSchema } from './block';
import { entryRoleEnum } from './core';

export const pageAttributesSchema = z.object({
  type: z.literal('page'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  content: z.record(blockSchema),
  collaborators: z.record(z.string(), entryRoleEnum).nullable().optional(),
});

export type PageAttributes = z.infer<typeof pageAttributesSchema>;
