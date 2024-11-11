import { Node } from '@colanode/core';

export type NodeWithAncestorsGetQueryInput = {
  type: 'node_with_ancestors_get';
  nodeId: string;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    node_with_ancestors_get: {
      input: NodeWithAncestorsGetQueryInput;
      output: Node[];
    };
  }
}
