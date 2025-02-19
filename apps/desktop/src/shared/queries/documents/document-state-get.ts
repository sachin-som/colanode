import { DocumentState } from '@/shared/types/documents';

export type DocumentStateGetQueryInput = {
  type: 'document_state_get';
  documentId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    document_state_get: {
      input: DocumentStateGetQueryInput;
      output: DocumentState | null;
    };
  }
}
