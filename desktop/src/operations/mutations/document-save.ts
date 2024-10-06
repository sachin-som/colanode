import { JSONContent } from '@tiptap/core';

export type DocumentSaveMutationInput = {
  type: 'document_save';
  userId: string;
  documentId: string;
  content: JSONContent;
};

export type DocumentSaveMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    document_save: {
      input: DocumentSaveMutationInput;
      output: DocumentSaveMutationOutput;
    };
  }
}
