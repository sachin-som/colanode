import { ServerNodeAttributes } from '@/types/nodes';
import {
  ColumnType,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from 'kysely';

interface AccountTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  email: ColumnType<string, string, never>;
  avatar: ColumnType<string | null, string | null, string | null>;
  password: ColumnType<string | null, string | null, string | null>;
  attrs: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  status: ColumnType<number, number, number>;
}

export type SelectAccount = Selectable<AccountTable>;
export type CreateAccount = Insertable<AccountTable>;
export type UpdateAccount = Updateable<AccountTable>;

interface WorkspaceTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  avatar: ColumnType<string | null, string | null, string | null>;
  attrs: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  status: ColumnType<number, number, number>;
  version_id: ColumnType<string, string, string>;
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

interface WorkspaceUserTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  attrs: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
  status: ColumnType<number, number, number>;
  version_id: ColumnType<string, string, string>;
}

export type SelectWorkspaceUser = Selectable<WorkspaceUserTable>;
export type CreateWorkspaceUser = Insertable<WorkspaceUserTable>;
export type UpdateWorkspaceUser = Updateable<WorkspaceUserTable>;

interface AccountDeviceTable {
  id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  type: ColumnType<number, number, number>;
  version: ColumnType<string, string, string>;
  platform: ColumnType<string | null, string | null, string | null>;
  cpu: ColumnType<string | null, string | null, string | null>;
  hostname: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  last_online_at: ColumnType<Date | null, Date | null, Date>;
  last_active_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectAccountDevice = Selectable<AccountDeviceTable>;
export type CreateAccountDevice = Insertable<AccountDeviceTable>;
export type UpdateAccountDevice = Updateable<AccountDeviceTable>;

interface NodeTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  parent_id: ColumnType<string | null, never, never>;
  type: ColumnType<string, never, never>;
  index: ColumnType<string | null, never, never>;
  attributes: JSONColumnType<
    ServerNodeAttributes,
    string | null,
    string | null
  >;
  state: ColumnType<string, string, string>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<Date, Date, never>;
  server_updated_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodeCollaboratorTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  workspace_id: ColumnType<string, string, never>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<Date, Date, never>;
  server_updated_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectNodeCollaborator = Selectable<NodeCollaboratorTable>;
export type CreateNodeCollaborator = Insertable<NodeCollaboratorTable>;
export type UpdateNodeCollaborator = Updateable<NodeCollaboratorTable>;

interface NodeReactionTable {
  node_id: ColumnType<string, string, never>;
  actor_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  created_at: ColumnType<Date, Date, never>;
  server_created_at: ColumnType<Date, Date, never>;
}

export type SelectNodeReaction = Selectable<NodeReactionTable>;
export type CreateNodeReaction = Insertable<NodeReactionTable>;
export type UpdateNodeReaction = Updateable<NodeReactionTable>;

interface ChangeTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  table: ColumnType<string, string, never>;
  action: ColumnType<string, string, never>;
  after: ColumnType<string | null, string | null, never>;
  before: ColumnType<string | null, string | null, never>;
  created_at: ColumnType<Date, Date, never>;
  device_ids: ColumnType<string[], string[], string[]>;
}

export type SelectChange = Selectable<ChangeTable>;
export type CreateChange = Insertable<ChangeTable>;
export type UpdateChange = Updateable<ChangeTable>;

export interface DatabaseSchema {
  accounts: AccountTable;
  workspaces: WorkspaceTable;
  workspace_users: WorkspaceUserTable;
  account_devices: AccountDeviceTable;
  nodes: NodeTable;
  node_collaborators: NodeCollaboratorTable;
  node_reactions: NodeReactionTable;
  changes: ChangeTable;
}
