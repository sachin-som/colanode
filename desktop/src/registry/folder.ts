import { z } from 'zod';
import { NodeRegistry } from '@/registry/core';

export const folderAttributesSchema = z.object({
  type: z.literal('folder'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  collaborators: z.record(z.string()).nullable().optional(),
});

export type FolderAttributes = z.infer<typeof folderAttributesSchema>;

export const FolderRegistry: NodeRegistry = {
  type: 'folder',
  schema: folderAttributesSchema,
};
