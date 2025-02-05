import {
  FileStatus,
  FileType,
  MutationType,
  NodeType,
  WorkspaceRole,
  TransactionOperation,
  UserStatus,
} from '@colanode/core';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

import { DownloadStatus, UploadStatus } from '@/shared/types/files';

interface UserTable {
  id: ColumnType<string, string, never>;
  email: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  avatar: ColumnType<string | null, string | null, string | null>;
  custom_name: ColumnType<string | null, string | null, string | null>;
  custom_avatar: ColumnType<string | null, string | null, string | null>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  status: ColumnType<UserStatus, UserStatus, UserStatus>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  revision: ColumnType<bigint, bigint, bigint>;
}

export type SelectUser = Selectable<UserTable>;
export type CreateUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;

interface NodeTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<NodeType, never, never>;
  parent_id: ColumnType<string | null, never, never>;
  root_id: ColumnType<string, string, never>;
  attributes: ColumnType<string, string, string>;
  local_revision: ColumnType<bigint, bigint, bigint>;
  server_revision: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodeStateTable {
  id: ColumnType<string, string, never>;
  state: ColumnType<Uint8Array, Uint8Array, Uint8Array>;
  revision: ColumnType<bigint, bigint, bigint>;
}

export type SelectNodeState = Selectable<NodeStateTable>;
export type CreateNodeState = Insertable<NodeStateTable>;
export type UpdateNodeState = Updateable<NodeStateTable>;

interface NodeTransactionTable {
  id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  operation: ColumnType<TransactionOperation, TransactionOperation, never>;
  data: ColumnType<Uint8Array, Uint8Array, never>;
  created_at: ColumnType<string, string, never>;
}

export type SelectNodeTransaction = Selectable<NodeTransactionTable>;
export type CreateNodeTransaction = Insertable<NodeTransactionTable>;
export type UpdateNodeTransaction = Updateable<NodeTransactionTable>;

interface NodeInteractionTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  revision: ColumnType<bigint, bigint, bigint>;
  first_seen_at: ColumnType<string | null, string | null, string | null>;
  last_seen_at: ColumnType<string | null, string | null, string | null>;
  first_opened_at: ColumnType<string | null, string | null, string | null>;
  last_opened_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeInteraction = Selectable<NodeInteractionTable>;
export type CreateNodeInteraction = Insertable<NodeInteractionTable>;
export type UpdateNodeInteraction = Updateable<NodeInteractionTable>;

interface NodeReactionTable {
  node_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, string>;
  root_id: ColumnType<string, string, string>;
  revision: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, never>;
}

export type SelectNodeReaction = Selectable<NodeReactionTable>;
export type CreateNodeReaction = Insertable<NodeReactionTable>;
export type UpdateNodeReaction = Updateable<NodeReactionTable>;

interface CollaborationTable {
  node_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  revision: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface FileTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<FileType, FileType, FileType>;
  parent_id: ColumnType<string, string, string>;
  root_id: ColumnType<string, string, string>;
  revision: ColumnType<bigint, bigint, bigint>;
  name: ColumnType<string, string, string>;
  original_name: ColumnType<string, string, string>;
  mime_type: ColumnType<string, string, string>;
  extension: ColumnType<string, string, string>;
  size: ColumnType<number, number, number>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<string | null, never, string | null>;
  download_status: ColumnType<DownloadStatus, DownloadStatus, DownloadStatus>;
  download_progress: ColumnType<number, number, number>;
  download_retries: ColumnType<number, number, number>;
  upload_status: ColumnType<UploadStatus, UploadStatus, UploadStatus>;
  upload_progress: ColumnType<number, number, number>;
  upload_retries: ColumnType<number, number, number>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string>;
  status: ColumnType<FileStatus, FileStatus, FileStatus>;
}

export type SelectFile = Selectable<FileTable>;
export type CreateFile = Insertable<FileTable>;
export type UpdateFile = Updateable<FileTable>;

interface MutationTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<MutationType, MutationType, never>;
  data: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  retries: ColumnType<number, number, number>;
}

export type SelectMutation = Selectable<MutationTable>;
export type CreateMutation = Insertable<MutationTable>;
export type UpdateMutation = Updateable<MutationTable>;

interface TombstoneTable {
  id: ColumnType<string, string, never>;
  data: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
}

export type SelectTombsonte = Selectable<TombstoneTable>;
export type CreateTombstone = Insertable<TombstoneTable>;
export type UpdateTombstone = Updateable<TombstoneTable>;

interface TextTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string | null, string | null, string | null>;
  text: ColumnType<string | null, string | null, string | null>;
}

export type SelectText = Selectable<TextTable>;
export type CreateText = Insertable<TextTable>;
export type UpdateText = Updateable<TextTable>;

interface CursorTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectCursor = Selectable<CursorTable>;
export type CreateCursor = Insertable<CursorTable>;
export type UpdateCursor = Updateable<CursorTable>;

interface MetadataTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectWorkspaceMetadata = Selectable<MetadataTable>;
export type CreateWorkspaceMetadata = Insertable<MetadataTable>;
export type UpdateWorkspaceMetadata = Updateable<MetadataTable>;

export interface WorkspaceDatabaseSchema {
  users: UserTable;
  nodes: NodeTable;
  node_states: NodeStateTable;
  node_interactions: NodeInteractionTable;
  node_transactions: NodeTransactionTable;
  node_reactions: NodeReactionTable;
  collaborations: CollaborationTable;
  files: FileTable;
  mutations: MutationTable;
  tombstones: TombstoneTable;
  texts: TextTable;
  cursors: CursorTable;
  metadata: MetadataTable;
}
