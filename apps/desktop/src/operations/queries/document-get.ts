import { JSONContent } from '@tiptap/core';

export type DocumentGetQueryInput = {
  type: 'document_get';
  documentId: string;
  userId: string;
};

export type DocumentGetQueryOutput = {
  content: JSONContent | null;
  hash: string | null;
};

declare module '@/operations/queries' {
  interface QueryMap {
    document_get: {
      input: DocumentGetQueryInput;
      output: DocumentGetQueryOutput;
    };
  }
}
