import { DocumentUpdateMergeMetadata } from '../types/documents';

export type SyncDocumentUpdatesInput = {
  type: 'document_updates';
  rootId: string;
};

export type SyncDocumentUpdateData = {
  id: string;
  documentId: string;
  data: string;
  revision: string;
  createdBy: string;
  createdAt: string;
  mergedUpdates: DocumentUpdateMergeMetadata[] | null | undefined;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    document_updates: {
      input: SyncDocumentUpdatesInput;
      data: SyncDocumentUpdateData;
    };
  }
}
