import { z } from 'zod';

export const folderAttributesSchema = z.object({
  type: z.literal('folder'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
});

export type FolderAttributes = z.infer<typeof folderAttributesSchema>;
