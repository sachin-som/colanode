import { Node, NodeType } from '@colanode/core';

export type NodeChildrenGetQueryInput = {
  type: 'node_children_get';
  nodeId: string;
  userId: string;
  types?: NodeType[];
};

declare module '@/operations/queries' {
  interface QueryMap {
    node_children_get: {
      input: NodeChildrenGetQueryInput;
      output: Node[];
    };
  }
}
