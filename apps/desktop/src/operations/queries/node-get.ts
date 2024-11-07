import { Node } from '@colanode/core';

export type NodeGetQueryInput = {
  type: 'node_get';
  nodeId: string;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    node_get: {
      input: NodeGetQueryInput;
      output: Node | null;
    };
  }
}
