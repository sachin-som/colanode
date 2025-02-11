import { Document } from '@/shared/types/documents';

export type DocumentGetQueryInput = {
  type: 'document_get';
  documentId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    document_get: {
      input: DocumentGetQueryInput;
      output: Document | null;
    };
  }
}
