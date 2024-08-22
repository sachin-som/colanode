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

export type NodeTransactionData = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  type: string;
  index: string | null;
  attrs: string | null;
  content: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at: string | null;
  server_version_id: string | null;
};
