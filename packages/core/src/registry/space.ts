import { z } from 'zod';

import { entryRoleEnum } from './core';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  parentId: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string(), entryRoleEnum),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;
