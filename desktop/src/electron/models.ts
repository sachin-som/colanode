export type AccountDbModel = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  token: string;
};

export type WorkspaceDbModel = {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  version_id: string;
  account_id: string;
  role: number;
  user_node_id: string;
}

export type TransactionDbModel = {
  id: string;
  workspace_id: string;
  account_id: string;
  type: string;
  node_id: string;
  input: string;
  created_at: number;
};