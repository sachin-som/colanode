export type SyncEntryTransactionsInput = {
  type: 'entry_transactions';
  rootId: string;
};

export type SyncCreateEntryTransactionData = {
  id: string;
  operation: 'create';
  entryId: string;
  rootId: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type SyncUpdateEntryTransactionData = {
  id: string;
  operation: 'update';
  entryId: string;
  rootId: string;
  workspaceId: string;
  data: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type SyncDeleteEntryTransactionData = {
  id: string;
  operation: 'delete';
  entryId: string;
  rootId: string;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  serverCreatedAt: string;
  version: string;
};

export type SyncEntryTransactionData =
  | SyncCreateEntryTransactionData
  | SyncUpdateEntryTransactionData
  | SyncDeleteEntryTransactionData;

declare module '@colanode/core' {
  interface SynchronizerMap {
    entry_transactions: {
      input: SyncEntryTransactionsInput;
      data: SyncEntryTransactionData;
    };
  }
}
