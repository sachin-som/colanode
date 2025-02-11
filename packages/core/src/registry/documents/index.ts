import { z } from 'zod';

import { richTextContentSchema, RichTextContent } from './rich-text';

export const documentContentSchema = z.discriminatedUnion('type', [
  richTextContentSchema,
]);

export type DocumentContent = RichTextContent;
export type DocumentType = DocumentContent['type'];
