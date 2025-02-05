import { z } from 'zod';

import { fieldAttributesSchema } from './field';

export const databaseAttributesSchema = z.object({
  type: z.literal('database'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  fields: z.record(z.string(), fieldAttributesSchema),
});

export type DatabaseAttributes = z.infer<typeof databaseAttributesSchema>;
