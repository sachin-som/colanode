import { LocalNode } from '@/shared/types/nodes';

export type NodeGetQueryInput = {
  type: 'node_get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    node_get: {
      input: NodeGetQueryInput;
      output: LocalNode | null;
    };
  }
}
