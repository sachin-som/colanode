import { ServerNodeBatchSyncData } from '@/types/sync';

export type NodeBatchSyncMutationInput = {
  type: 'node_batch_sync';
  accountId: string;
  workspaceId: string;
  nodes: ServerNodeBatchSyncData[];
};

export type NodeBatchSyncMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_batch_sync: {
      input: NodeBatchSyncMutationInput;
      output: NodeBatchSyncMutationOutput;
    };
  }
}
