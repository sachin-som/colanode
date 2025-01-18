import { WorkspaceRole } from '@colanode/core';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface WorkspaceTable {
  id: ColumnType<string, string, never>;
  user_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  avatar: ColumnType<string | null, string | null, string | null>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  storage_limit: ColumnType<bigint, bigint, bigint>;
  max_file_size: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, never>;
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

export interface AccountDatabaseSchema {
  workspaces: WorkspaceTable;
}
