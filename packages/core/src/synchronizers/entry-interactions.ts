export type SyncEntryInteractionsInput = {
  type: 'entry_interactions';
  rootId: string;
};

export type SyncEntryInteractionData = {
  entryId: string;
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
    entry_interactions: {
      input: SyncEntryInteractionsInput;
      data: SyncEntryInteractionData;
    };
  }
}
