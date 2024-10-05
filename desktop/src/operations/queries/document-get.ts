import { LocalNode } from '@/types/nodes';

export type DocumentGetQueryInput = {
  type: 'document_get';
  nodeId: string;
  userId: string;
};

export type DocumentGetQueryOutput = {
  nodes: Map<string, LocalNode>;
};

declare module '@/operations/queries' {
  interface QueryMap {
    document_get: {
      input: DocumentGetQueryInput;
      output: DocumentGetQueryOutput;
    };
  }
}
