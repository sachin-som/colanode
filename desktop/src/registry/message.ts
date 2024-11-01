import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';
import { blockSchema } from '@/registry/block';

export const messageAttributesSchema = z.object({
  type: z.literal('message'),
  parentId: z.string().nullable(),
  content: z.record(z.string(), blockSchema),
  reactions: z.record(z.array(z.string())),
});

export type MessageAttributes = z.infer<typeof messageAttributesSchema>;

export const MessageRegistry: NodeRegistry = {
  type: 'message',
  schema: messageAttributesSchema,
};
