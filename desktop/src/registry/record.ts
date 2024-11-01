import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';
import { fieldValueSchema } from '@/registry/fields';
import { blockSchema } from '@/registry/block';
export const recordAttributesSchema = z.object({
  type: z.literal('record'),
  parentId: z.string(),
  databaseId: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  fields: z.record(z.string(), fieldValueSchema),
  content: z.record(blockSchema),
});

export type RecordAttributes = z.infer<typeof recordAttributesSchema>;

export const RecordRegistry: NodeRegistry = {
  type: 'record',
  schema: recordAttributesSchema,
};
