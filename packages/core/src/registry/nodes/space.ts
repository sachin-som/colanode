import { z } from 'zod';

import { NodeModel, nodeRoleEnum } from './core';

import { NodeAttributes } from '.';

export const spaceAttributesSchema = z.object({
  type: z.literal('space'),
  name: z.string(),
  description: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  collaborators: z.record(z.string(), nodeRoleEnum),
  visibility: z.enum(['public', 'private']).default('private'),
});

export type SpaceAttributes = z.infer<typeof spaceAttributesSchema>;

export const spaceModel: NodeModel = {
  type: 'space',
  attributesSchema: spaceAttributesSchema,
  canCreate: async (context, _) => {
    return context.hasCollaboratorAccess();
  },
  canUpdate: async (context, _) => {
    return context.hasCollaboratorAccess();
  },
  canDelete: async (context, _) => {
    return context.hasCollaboratorAccess();
  },
  getName: function (
    _: string,
    attributes: NodeAttributes
  ): string | null | undefined {
    if (attributes.type !== 'space') {
      return null;
    }

    return attributes.name;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
