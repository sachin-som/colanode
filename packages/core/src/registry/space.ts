import { z } from 'zod';

import { entryRoleEnum } from './core';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string(), entryRoleEnum),
  visibility: z.enum(['public', 'private']).default('private'),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;
