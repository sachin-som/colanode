import { z } from 'zod';

import { NodeModel, nodeRoleEnum } from './core';

import { NodeAttributes } from '.';

export const chatAttributesSchema = z.object({
  type: z.literal('chat'),
  collaborators: z.record(z.string(), nodeRoleEnum),
});

export type ChatAttributes = z.infer<typeof chatAttributesSchema>;

export const chatModel: NodeModel = {
  type: 'chat',
  attributesSchema: chatAttributesSchema,
  canCreate: async (_, __) => {
    return true;
  },
  canUpdate: async (_, __) => {
    return false;
  },
  canDelete: async (_, __) => {
    return false;
  },
  getName: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
  getText: function (_: string, __: NodeAttributes): string | null | undefined {
    return undefined;
  },
};
