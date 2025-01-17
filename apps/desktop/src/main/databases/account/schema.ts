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
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

export interface AccountDatabaseSchema {
  workspaces: WorkspaceTable;
}
