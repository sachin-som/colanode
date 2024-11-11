import { z } from 'zod';
import { NodeModel } from './core';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  parentId: z.string(),
  description: z.string().nullable(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string()),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;

export const spaceModel: NodeModel = {
  type: 'space',
  schema: spaceAttributesSchema,
  canCreate: async (context, __) => {
    if (context.workspaceRole === 'guest' || context.workspaceRole === 'none') {
      return false;
    }

    return true;
  },
  canUpdate: async (context, _, __) => {
    return context.hasAdminAccess();
  },
  canDelete: async (context, _) => {
    return context.hasAdminAccess();
  },
};
