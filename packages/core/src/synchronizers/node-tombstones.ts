export type SyncNodeTombstonesInput = {
  type: 'node_tombstones';
  rootId: string;
};

export type SyncNodeTombstoneData = {
  id: string;
  rootId: string;
  workspaceId: string;
  deletedBy: string;
  deletedAt: string;
  revision: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    node_tombstones: {
      input: SyncNodeTombstonesInput;
      data: SyncNodeTombstoneData;
    };
  }
}
