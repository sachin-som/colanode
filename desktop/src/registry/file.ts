import { z } from 'zod';
import { NodeModel } from '@/registry/core';

export const fileAttributesSchema = z.object({
  type: z.literal('file'),
  name: z.string(),
  parentId: z.string(),
  mimeType: z.string(),
  size: z.number(),
  extension: z.string(),
  fileName: z.string(),
});

export type FileAttributes = z.infer<typeof fileAttributesSchema>;

export const fileModel: NodeModel = {
  type: 'file',
  schema: fileAttributesSchema,
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
