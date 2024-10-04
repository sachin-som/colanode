export type NodeSyncMutationInput = {
  type: 'node_sync';
  accountId: string;
  workspaceId: string;
  id: string;
  action: string;
  before: any;
  after: any;
};

export type NodeSyncMutationOutput = {
  success: boolean;
};

declare module '@/types/mutations' {
  interface MutationMap {
    node_sync: {
      input: NodeSyncMutationInput;
      output: NodeSyncMutationOutput;
    };
  }
}
