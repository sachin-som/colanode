import { z } from 'zod';

import { entryRoleEnum } from './core';

export const chatAttributesSchema = z.object({
  type: z.literal('chat'),
  collaborators: z.record(z.string(), entryRoleEnum),
});

export type ChatAttributes = z.infer<typeof chatAttributesSchema>;
