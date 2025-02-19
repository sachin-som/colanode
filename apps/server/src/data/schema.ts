import {
  NodeAttributes,
  NodeRole,
  NodeType,
  WorkspaceRole,
  UserStatus,
  DocumentType,
  DocumentContent,
  DocumentUpdateMergeMetadata,
} from '@colanode/core';
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
  ip: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  synced_at: ColumnType<Date | null, Date | null, Date>;
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
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

interface UserTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, never, never>;
  email: ColumnType<string, string, string>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  name: ColumnType<string, string, string>;
  avatar: ColumnType<string | null, string | null, string | null>;
  custom_name: ColumnType<string | null, string | null, string | null>;
  custom_avatar: ColumnType<string | null, string | null, string | null>;
  storage_limit: ColumnType<bigint, bigint, bigint>;
  max_file_size: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
  status: ColumnType<UserStatus, UserStatus, UserStatus>;
}

export type SelectUser = Selectable<UserTable>;
export type CreateUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;

interface NodeTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<NodeType, never, never>;
  parent_id: ColumnType<string | null, never, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, never, never>;
  attributes: JSONColumnType<NodeAttributes, string | null, string | null>;
  state: ColumnType<Uint8Array, Uint8Array, Uint8Array>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodeInteractionTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, never, never>;
  first_seen_at: ColumnType<Date | null, Date | null, Date | null>;
  last_seen_at: ColumnType<Date | null, Date | null, Date | null>;
  first_opened_at: ColumnType<Date | null, Date | null, Date | null>;
  last_opened_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type SelectNodeInteraction = Selectable<NodeInteractionTable>;
export type CreateNodeInteraction = Insertable<NodeInteractionTable>;
export type UpdateNodeInteraction = Updateable<NodeInteractionTable>;

interface NodeReactionTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, never, never>;
  reaction: ColumnType<string, string, string>;
  created_at: ColumnType<Date, Date, Date>;
  deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type SelectNodeReaction = Selectable<NodeReactionTable>;
export type CreateNodeReaction = Insertable<NodeReactionTable>;
export type UpdateNodeReaction = Updateable<NodeReactionTable>;

interface NodeTombstoneTable {
  id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, never, never>;
  deleted_at: ColumnType<Date, Date, Date>;
  deleted_by: ColumnType<string, string, never>;
}

export type SelectNodeTombstone = Selectable<NodeTombstoneTable>;
export type CreateNodeTombstone = Insertable<NodeTombstoneTable>;
export type UpdateNodeTombstone = Updateable<NodeTombstoneTable>;

interface NodePathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectNodePath = Selectable<NodePathTable>;
export type CreateNodePath = Insertable<NodePathTable>;
export type UpdateNodePath = Updateable<NodePathTable>;

interface CollaborationTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, never, never>;
  role: ColumnType<NodeRole, NodeRole, NodeRole>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date | null>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<Date | null, Date | null, Date | null>;
  deleted_by: ColumnType<string | null, string | null, string | null>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface DocumentTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<DocumentType, never, never>;
  workspace_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, bigint, bigint>;
  content: JSONColumnType<DocumentContent, string, string>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
}

export type SelectDocument = Selectable<DocumentTable>;
export type CreateDocument = Insertable<DocumentTable>;
export type UpdateDocument = Updateable<DocumentTable>;

interface DocumentUpdateTable {
  id: ColumnType<string, string, never>;
  document_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, never, never>;
  data: ColumnType<Uint8Array, Uint8Array, Uint8Array>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  merged_updates: ColumnType<
    DocumentUpdateMergeMetadata[] | null,
    string | null,
    string | null
  >;
}

export type SelectDocumentUpdate = Selectable<DocumentUpdateTable>;
export type CreateDocumentUpdate = Insertable<DocumentUpdateTable>;
export type UpdateDocumentUpdate = Updateable<DocumentUpdateTable>;

export interface DatabaseSchema {
  accounts: AccountTable;
  devices: DeviceTable;
  workspaces: WorkspaceTable;
  users: UserTable;
  nodes: NodeTable;
  node_interactions: NodeInteractionTable;
  node_reactions: NodeReactionTable;
  node_paths: NodePathTable;
  node_tombstones: NodeTombstoneTable;
  collaborations: CollaborationTable;
  documents: DocumentTable;
  document_updates: DocumentUpdateTable;
}
