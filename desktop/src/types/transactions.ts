export type TransactionTable = 'nodes';

export type TransactionAction = 'insert' | 'update' | 'delete';

export type Transaction = {
  id: string;
  workspaceId: string;
  action: TransactionAction;
  table: TransactionTable;
  after?: string | null;
  before?: string | null;
  createdAt: string;
};
