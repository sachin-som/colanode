import { LocalNode } from '@/shared/types/nodes';

export type NodeTreeGetQueryInput = {
  type: 'node_tree_get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    node_tree_get: {
      input: NodeTreeGetQueryInput;
      output: LocalNode[];
    };
  }
}
