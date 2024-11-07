import { z } from 'zod';
import { NodeModel } from './core';

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
