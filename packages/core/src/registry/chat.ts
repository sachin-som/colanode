import { z } from 'zod';

import { nodeRoleEnum } from './core';

export const chatAttributesSchema = z.object({
  type: z.literal('chat'),
  collaborators: z.record(z.string(), nodeRoleEnum),
});

export type ChatAttributes = z.infer<typeof chatAttributesSchema>;
