import { DocumentContent } from '@colanode/core';

import { SelectDocument } from '@/data/schema';

export type CreateDocumentInput = {
  nodeId: string;
  content: DocumentContent;
  userId: string;
  workspaceId: string;
};

export type CreateDocumentOutput = {
  document: SelectDocument;
};
