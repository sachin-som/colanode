import { JSONContent } from '@tiptap/core';

export type DocumentGetQueryInput = {
  type: 'document_get';
  documentId: string;
  userId: string;
};

export type DocumentGetQueryOutput = {
  content: JSONContent;
  hash: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    document_get: {
      input: DocumentGetQueryInput;
      output: DocumentGetQueryOutput;
    };
  }
}
