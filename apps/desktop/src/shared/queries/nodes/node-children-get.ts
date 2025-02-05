import { NodeType } from '@colanode/core';

import { LocalNode } from '@/shared/types/nodes';

export type NodeChildrenGetQueryInput = {
  type: 'node_children_get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
  types?: NodeType[];
};

declare module '@/shared/queries' {
  interface QueryMap {
    node_children_get: {
      input: NodeChildrenGetQueryInput;
      output: LocalNode[];
    };
  }
}
