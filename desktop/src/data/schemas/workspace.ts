export interface NodesTableSchema {
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
  server_created_at: string | null;
  server_updated_at: string | null;
  server_version_id: string | null;
}

export interface TransactionsTableSchema {
  id: string;
  action: string;
  table: string;
  after?: string | null;
  before?: string | null;
  created_at: string;
}

export interface WorkspaceDatabaseSchema {
  nodes: NodesTableSchema;
  transactions: TransactionsTableSchema;
}
