import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';

export const chatAttributesSchema = z.object({
  type: z.literal('chat'),
  parentId: z.string(),
  collaborators: z.record(z.string()),
});

export type ChatAttributes = z.infer<typeof chatAttributesSchema>;

export const ChatRegistry: NodeRegistry = {
  type: 'chat',
  schema: chatAttributesSchema,
};
