import { z } from 'zod';
import { NodeModel } from './core';

export const userAttributesSchema = z.object({
  type: z.literal('user'),
  name: z.string(),
  parentId: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  accountId: z.string(),
  role: z.enum(['owner', 'admin', 'editor', 'collaborator', 'viewer']),
});

export type UserAttributes = z.infer<typeof userAttributesSchema>;

export const userModel: NodeModel = {
  type: 'user',
  schema: userAttributesSchema,
  canCreate: async (_, __) => {
    return true;
  },
  canUpdate: async (_, __, ___) => {
    return true;
  },
  canDelete: async (_, __) => {
    return true;
  },
};
