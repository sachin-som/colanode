import { z } from 'zod';
import { NodeModel } from './core';
import { blockSchema } from './block';
import { isEqual } from 'lodash-es';

export const messageAttributesSchema = z.object({
  type: z.literal('message'),
  parentId: z.string().nullable(),
  content: z.record(z.string(), blockSchema),
  reactions: z.record(z.array(z.string())),
});

export type MessageAttributes = z.infer<typeof messageAttributesSchema>;

export const messageModel: NodeModel = {
  type: 'message',
  schema: messageAttributesSchema,
  canCreate: async (context, attributes) => {
    if (attributes.type !== 'message') {
      return false;
    }

    return context.hasCollaboratorAccess();
  },
  canUpdate: async (context, node, attributes) => {
    if (attributes.type !== 'message' || node.type !== 'message') {
      return false;
    }

    if (!isEqual(attributes.content, node.attributes.content)) {
      return context.userId === node.createdBy;
    }

    return context.hasCollaboratorAccess();
  },
  canDelete: async (context, node) => {
    if (node.type !== 'message') {
      return false;
    }

    if (context.userId === node.createdBy) {
      return true;
    }

    return context.hasAdminAccess();
  },
};
