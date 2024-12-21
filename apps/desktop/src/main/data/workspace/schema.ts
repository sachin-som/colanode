import { InteractionAttribute, NodeType, WorkspaceRole } from '@colanode/core';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface UserTable {
  id: ColumnType<string, string, never>;
  email: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
  avatar: ColumnType<string | null, string | null, string | null>;
  custom_name: ColumnType<string | null, string | null, string | null>;
  custom_avatar: ColumnType<string | null, string | null, string | null>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  status: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectUser = Selectable<UserTable>;
export type CreateUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;

interface NodeTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<NodeType, never, never>;
  parent_id: ColumnType<string, never, never>;
  root_id: ColumnType<string, string, never>;
  attributes: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  transaction_id: ColumnType<string, string, string>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodePathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectNodePath = Selectable<NodePathTable>;

interface TransactionTable {
  id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  operation: ColumnType<string, string, never>;
  data: ColumnType<Uint8Array | null, Uint8Array | null, never>;
  created_at: ColumnType<string, string, never>;
  created_by: ColumnType<string, string, never>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  retry_count: ColumnType<number, number, number>;
  status: ColumnType<string, string, string>;
  version: ColumnType<bigint | null, bigint | null, bigint | null>;
}

export type SelectTransaction = Selectable<TransactionTable>;
export type CreateTransaction = Insertable<TransactionTable>;
export type UpdateTransaction = Updateable<TransactionTable>;

interface CollaborationTable {
  node_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface UploadTable {
  node_id: ColumnType<string, string, never>;
  upload_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  progress: ColumnType<number, number, number>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectUpload = Selectable<UploadTable>;
export type CreateUpload = Insertable<UploadTable>;
export type UpdateUpload = Updateable<UploadTable>;

interface DownloadTable {
  node_id: ColumnType<string, string, never>;
  upload_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  completed_at: ColumnType<string | null, string | null, string | null>;
  progress: ColumnType<number, number, number>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectDownload = Selectable<DownloadTable>;
export type CreateDownload = Insertable<DownloadTable>;
export type UpdateDownload = Updateable<DownloadTable>;

interface InteractionTable {
  user_id: ColumnType<string, string, never>;
  node_id: ColumnType<string, string, never>;
  attributes: ColumnType<string, string, string>;
  last_seen_at: ColumnType<string | null, string | null, string | null>;
  last_opened_at: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  server_updated_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint | null, bigint | null, bigint | null>;
}

export type SelectInteraction = Selectable<InteractionTable>;
export type CreateInteraction = Insertable<InteractionTable>;
export type UpdateInteraction = Updateable<InteractionTable>;

interface InteractionEventTable {
  node_id: ColumnType<string, string, never>;
  attribute: ColumnType<InteractionAttribute, string, string>;
  value: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  sent_at: ColumnType<string | null, string | null, string | null>;
  sent_count: ColumnType<number, number, number>;
  event_id: ColumnType<string, string, string>;
}

export type SelectInteractionEvent = Selectable<InteractionEventTable>;
export type CreateInteractionEvent = Insertable<InteractionEventTable>;
export type UpdateInteractionEvent = Updateable<InteractionEventTable>;

interface NodeNameTable {
  id: ColumnType<string, string, never>;
  name: ColumnType<string, string, string>;
}

export type SelectNodeName = Selectable<NodeNameTable>;
export type CreateNodeName = Insertable<NodeNameTable>;
export type UpdateNodeName = Updateable<NodeNameTable>;

interface NodeTextTable {
  id: ColumnType<string, string, never>;
  text: ColumnType<string, string, string>;
}

export type SelectNodeText = Selectable<NodeTextTable>;
export type CreateNodeText = Insertable<NodeTextTable>;
export type UpdateNodeText = Updateable<NodeTextTable>;

interface CursorTable {
  key: ColumnType<string, string, never>;
  value: ColumnType<bigint, bigint, bigint>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export interface WorkspaceDatabaseSchema {
  users: UserTable;
  nodes: NodeTable;
  transactions: TransactionTable;
  node_paths: NodePathTable;
  collaborations: CollaborationTable;
  uploads: UploadTable;
  downloads: DownloadTable;
  interactions: InteractionTable;
  interaction_events: InteractionEventTable;
  node_names: NodeNameTable;
  node_texts: NodeTextTable;
  cursors: CursorTable;
}
