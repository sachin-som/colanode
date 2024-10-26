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

interface DeviceTable {
  id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  token_hash: ColumnType<string, string, string>;
  token_salt: ColumnType<string, string, string>;
  token_generated_at: ColumnType<Date, Date, Date>;
  previous_token_hash: ColumnType<string | null, string | null, string | null>;
  previous_token_salt: ColumnType<string | null, string | null, string | null>;
  type: ColumnType<number, number, number>;
  version: ColumnType<string, string, string>;
  platform: ColumnType<string | null, string | null, string | null>;
  cpu: ColumnType<string | null, string | null, string | null>;
  hostname: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  last_online_at: ColumnType<Date | null, Date | null, Date>;
  last_active_at: ColumnType<Date | null, Date | null, Date>;
}

export type SelectDevice = Selectable<DeviceTable>;
export type CreateDevice = Insertable<DeviceTable>;
export type UpdateDevice = Updateable<DeviceTable>;

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

interface NodePathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectNodePath = Selectable<NodePathTable>;
export type CreateNodePath = Insertable<NodePathTable>;
export type UpdateNodePath = Updateable<NodePathTable>;

interface NodeCollaboratorTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  created_at: ColumnType<Date, Date, never>;
}

export type SelectNodeCollaborator = Selectable<NodeCollaboratorTable>;
export type CreateNodeCollaborator = Insertable<NodeCollaboratorTable>;
export type UpdateNodeCollaborator = Updateable<NodeCollaboratorTable>;

interface NodeUserStateTable {
  node_id: ColumnType<string, string, never>;
  user_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  last_seen_version_id: ColumnType<string | null, string | null, string | null>;
  last_seen_at: ColumnType<Date | null, Date | null, Date>;
  mentions_count: ColumnType<number, number, number>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  access_removed_at: ColumnType<Date | null, Date | null, Date>;
  version_id: ColumnType<string, string, string>;
}

export type SelectNodeUserState = Selectable<NodeUserStateTable>;
export type CreateNodeUserState = Insertable<NodeUserStateTable>;
export type UpdateNodeUserState = Updateable<NodeUserStateTable>;

interface NodeDeviceStateTable {
  node_id: ColumnType<string, string, never>;
  device_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, string>;
  node_version_id: ColumnType<string | null, string | null, string | null>;
  user_state_version_id: ColumnType<
    string | null,
    string | null,
    string | null
  >;
  node_synced_at: ColumnType<Date | null, Date | null, Date>;
  user_state_synced_at: ColumnType<Date | null, Date | null, Date>;
}

export interface DatabaseSchema {
  accounts: AccountTable;
  devices: DeviceTable;
  workspaces: WorkspaceTable;
  workspace_users: WorkspaceUserTable;
  nodes: NodeTable;
  node_paths: NodePathTable;
  node_collaborators: NodeCollaboratorTable;
  node_user_states: NodeUserStateTable;
  node_device_states: NodeDeviceStateTable;
}
