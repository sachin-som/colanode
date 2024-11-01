import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';

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

export const FileRegistry: NodeRegistry = {
  type: 'file',
  schema: fileAttributesSchema,
};
