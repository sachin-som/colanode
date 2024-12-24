export type SyncTransactionsInput = {
  type: 'transactions';
  rootId: string;
};

export type SyncCreateTransactionData = {
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

export type SyncUpdateTransactionData = {
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

export type SyncDeleteTransactionData = {
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

export type SyncTransactionData =
  | SyncCreateTransactionData
  | SyncUpdateTransactionData
  | SyncDeleteTransactionData;

declare module '@colanode/core' {
  interface SynchronizerMap {
    transactions: {
      input: SyncTransactionsInput;
      data: SyncTransactionData;
    };
  }
}
