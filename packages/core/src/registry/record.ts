import { z } from 'zod';

import { blockSchema } from './block';
import { fieldValueSchema } from './field-value';

export const recordAttributesSchema = z.object({
  type: z.literal('record'),
  parentId: z.string(),
  databaseId: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  fields: z.record(z.string(), fieldValueSchema),
  content: z.record(blockSchema).nullable().optional(),
});

export type RecordAttributes = z.infer<typeof recordAttributesSchema>;
