import { z } from 'zod';

import { entryRoleEnum } from './core';

export const folderAttributesSchema = z.object({
  type: z.literal('folder'),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  parentId: z.string(),
  collaborators: z.record(z.string(), entryRoleEnum).nullable().optional(),
});

export type FolderAttributes = z.infer<typeof folderAttributesSchema>;
