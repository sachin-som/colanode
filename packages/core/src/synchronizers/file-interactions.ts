export type SyncFileInteractionsInput = {
  type: 'file_interactions';
  rootId: string;
};

export type SyncFileInteractionData = {
  fileId: string;
  collaboratorId: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  rootId: string;
  workspaceId: string;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    file_interactions: {
      input: SyncFileInteractionsInput;
      data: SyncFileInteractionData;
    };
  }
}
