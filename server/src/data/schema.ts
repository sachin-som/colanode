import { NodeBlock } from '@/types/nodes';
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

interface WorkspaceAccountTable {
  workspace_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  user_id: ColumnType<string, string, never>;
  role: ColumnType<number, number, number>;
  attrs: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
  status: ColumnType<number, number, number>;
  version_id: ColumnType<string, string, string>;
}

export type SelectWorkspaceAccount = Selectable<WorkspaceAccountTable>;
export type CreateWorkspaceAccount = Insertable<WorkspaceAccountTable>;
export type UpdateWorkspaceAccount = Updateable<WorkspaceAccountTable>;

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
  parent_id: ColumnType<string | null, string | null, string | null>;
  type: ColumnType<string, string, string>;
  index: ColumnType<string | null, string | null, string | null>;
  content: JSONColumnType<NodeBlock[] | null, string | null, string | null>;
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

interface NodeAttributeTable {
  node_id: ColumnType<string, string, never>;
  type: ColumnType<string, string, never>;
  key: ColumnType<string, string, string>;
  workspace_id: ColumnType<string, string, never>;
  text_value: ColumnType<string | null, string | null, string | null>;
  number_value: ColumnType<number | null, number | null, number | null>;
  foreign_node_id: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<Date, Date, never>;
  server_updated_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectNodeAttribute = Selectable<NodeAttributeTable>;
export type CreateNodeAttribute = Insertable<NodeAttributeTable>;
export type UpdateNodeAttribute = Updateable<NodeAttributeTable>;

interface NodeReactionTable {
  node_id: ColumnType<string, string, never>;
  reactor_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  created_at: ColumnType<Date, Date, never>;
  server_created_at: ColumnType<Date, Date, never>;
}

export type SelectNodeReaction = Selectable<NodeReactionTable>;
export type CreateNodeReaction = Insertable<NodeReactionTable>;
export type UpdateNodeReaction = Updateable<NodeReactionTable>;

interface MutationTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  table: ColumnType<string, string, never>;
  action: ColumnType<string, string, never>;
  after: ColumnType<string | null, string | null, never>;
  before: ColumnType<string | null, string | null, never>;
  created_at: ColumnType<Date, Date, never>;
  device_ids: ColumnType<string[], string[], string[]>;
}

export type SelectMutation = Selectable<MutationTable>;
export type CreateMutation = Insertable<MutationTable>;
export type UpdateMutation = Updateable<MutationTable>;

export interface DatabaseSchema {
  accounts: AccountTable;
  workspaces: WorkspaceTable;
  workspace_accounts: WorkspaceAccountTable;
  account_devices: AccountDeviceTable;
  nodes: NodeTable;
  node_attributes: NodeAttributeTable;
  node_reactions: NodeReactionTable;
  mutations: MutationTable;
}
