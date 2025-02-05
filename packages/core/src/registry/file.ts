import { z } from 'zod';

export const fileAttributesSchema = z.object({
  type: z.literal('file'),
  name: z.string().optional(),
  parentId: z.string(),
  index: z.string().optional(),
});

export type FileAttributes = z.infer<typeof fileAttributesSchema>;
