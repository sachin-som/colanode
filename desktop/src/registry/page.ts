import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';
import { blockSchema } from '@/registry/block';

export const pageAttributesSchema = z.object({
  type: z.literal('page'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  content: z.record(blockSchema),
  collaborators: z.record(z.string()).nullable().optional(),
});

export type PageAttributes = z.infer<typeof pageAttributesSchema>;

export const PageRegistry: NodeRegistry = {
  type: 'page',
  schema: pageAttributesSchema,
};
