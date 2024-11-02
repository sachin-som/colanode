import { z } from 'zod';
import { NodeModel } from '@/registry/core';
import { WorkspaceRole } from '@/types/workspaces';

export const userAttributesSchema = z.object({
  type: z.literal('user'),
  name: z.string(),
  parentId: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  accountId: z.string(),
  role: z.nativeEnum(WorkspaceRole),
});

export type UserAttributes = z.infer<typeof userAttributesSchema>;

export const userModel: NodeModel = {
  type: 'user',
  schema: userAttributesSchema,
  canCreate: async (context, attributes) => {
    return true;
  },
  canUpdate: async (context, node, attributes) => {
    return true;
  },
  canDelete: async (context, node) => {
    return true;
  },
};
