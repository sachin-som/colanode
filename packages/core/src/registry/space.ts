import { z } from 'zod';

import { nodeRoleEnum } from './core';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string(), nodeRoleEnum),
  visibility: z.enum(['public', 'private']).default('private'),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;
