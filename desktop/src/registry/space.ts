import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  parentId: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string()),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;

export const SpaceRegistry: NodeRegistry = {
  type: 'space',
  schema: spaceAttributesSchema,
};
