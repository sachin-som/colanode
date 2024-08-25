export interface AccountsTableSchema {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  token: string;
  device_id: string;
}

export interface WorkspacesTableSchema {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  version_id: string;
  role: number;
  user_id: string;
  synced: number;
}

export interface AppDatabaseSchema {
  accounts: AccountsTableSchema;
  workspaces: WorkspacesTableSchema;
}
