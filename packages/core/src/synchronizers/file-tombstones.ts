export type SyncFileTombstonesInput = {
  type: 'file_tombstones';
  rootId: string;
};

export type SyncFileTombstoneData = {
  id: string;
  rootId: string;
  workspaceId: string;
  deletedBy: string;
  deletedAt: string;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    file_tombstones: {
      input: SyncFileTombstonesInput;
      data: SyncFileTombstoneData;
    };
  }
}
