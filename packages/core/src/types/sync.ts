export type LocalTransaction =
  | LocalCreateTransaction
  | LocalUpdateTransaction
  | LocalDeleteTransaction;

export type LocalCreateTransaction = {
  id: string;
  entryId: string;
  rootId: string;
  operation: 'create';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalUpdateTransaction = {
  id: string;
  entryId: string;
  rootId: string;
  operation: 'update';
  data: string;
  createdAt: string;
  createdBy: string;
};

export type LocalDeleteTransaction = {
  id: string;
  entryId: string;
  rootId: string;
  operation: 'delete';
  createdAt: string;
  createdBy: string;
};
