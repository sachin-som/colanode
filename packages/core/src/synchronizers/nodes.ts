export type SyncNodesInput = {
  type: 'nodes';
  rootId: string;
};

export type SyncNodeData = {
  id: string;
  rootId: string;
  workspaceId: string;
  revision: string;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    nodes: {
      input: SyncNodesInput;
      data: SyncNodeData;
    };
  }
}
