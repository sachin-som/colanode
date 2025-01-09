export enum TransactionOperation {
  Create = 1,
  Update = 2,
  Delete = 3,
}

export type LocalTransaction =
  | LocalCreateTransaction
  | LocalUpdateTransaction
  | LocalDeleteTransaction;

export type LocalCreateTransaction = {
  id: string;
  entryId: string;
  rootId: string;
  operation: TransactionOperation.Create;
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalUpdateTransaction = {
  id: string;
  entryId: string;
  rootId: string;
  operation: TransactionOperation.Update;
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalDeleteTransaction = {
  id: string;
  entryId: string;
  rootId: string;
  operation: TransactionOperation.Delete;
  createdAt: string;
  createdBy: string;
};
