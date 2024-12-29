export type SyncMessageTombstonesInput = {
  type: 'message_tombstones';
  rootId: string;
};

export type SyncMessageTombstoneData = {
  id: string;
  rootId: string;
  workspaceId: string;
  deletedAt: string;
  deletedBy: string;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    message_tombstones: {
      input: SyncMessageTombstonesInput;
      data: SyncMessageTombstoneData;
    };
  }
}
