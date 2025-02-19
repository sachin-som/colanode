import { DocumentUpdate } from '@/shared/types/documents';

export type DocumentUpdatesListQueryInput = {
  type: 'document_updates_list';
  documentId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    document_updates_list: {
      input: DocumentUpdatesListQueryInput;
      output: DocumentUpdate[];
    };
  }
}
