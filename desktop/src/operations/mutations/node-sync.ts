import { ServerNodeSyncData } from '@/types/sync';

export type NodeSyncMutationInput = {
  type: 'node_sync';
  accountId: string;
  nodes: ServerNodeSyncData[];
};

export type NodeSyncMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_sync: {
      input: NodeSyncMutationInput;
      output: NodeSyncMutationOutput;
    };
  }
}
