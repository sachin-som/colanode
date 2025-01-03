import {
  FileStatus,
  FileType,
  EntryAttributes,
  EntryRole,
  EntryType,
  WorkspaceRole,
  MessageType,
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
}

export type SelectWorkspace = Selectable<WorkspaceTable>;
export type CreateWorkspace = Insertable<WorkspaceTable>;
export type UpdateWorkspace = Updateable<WorkspaceTable>;

interface UserTable {
  id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  account_id: ColumnType<string, string, never>;
  email: ColumnType<string, string, string>;
  role: ColumnType<WorkspaceRole, WorkspaceRole, WorkspaceRole>;
  name: ColumnType<string, string, string>;
  avatar: ColumnType<string | null, string | null, string | null>;
  custom_name: ColumnType<string | null, string | null, string | null>;
  custom_avatar: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
  status: ColumnType<number, number, number>;
  version: ColumnType<bigint, never, never>;
}

export type SelectUser = Selectable<UserTable>;
export type CreateUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;

interface EntryTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<EntryType, never, never>;
  parent_id: ColumnType<string | null, never, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  attributes: JSONColumnType<EntryAttributes, string | null, string | null>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string>;
  transaction_id: ColumnType<string, string, string>;
}

export type SelectEntry = Selectable<EntryTable>;
export type CreateEntry = Insertable<EntryTable>;
export type UpdateEntry = Updateable<EntryTable>;

interface CollaborationTable {
  entry_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  role: ColumnType<EntryRole, EntryRole, EntryRole>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date | null>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<Date | null, Date | null, Date | null>;
  deleted_by: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, never, never>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface EntryTransactionTable {
  id: ColumnType<string, string, never>;
  entry_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  operation: ColumnType<string, string, never>;
  data: ColumnType<Uint8Array | null, Uint8Array | null, Uint8Array | null>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  server_created_at: ColumnType<Date, Date, never>;
  version: ColumnType<bigint, never, never>;
}

export type SelectEntryTransaction = Selectable<EntryTransactionTable>;
export type CreateEntryTransaction = Insertable<EntryTransactionTable>;
export type UpdateEntryTransaction = Updateable<EntryTransactionTable>;

interface EntryInteractionTable {
  entry_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  first_seen_at: ColumnType<Date | null, Date | null, Date | null>;
  last_seen_at: ColumnType<Date | null, Date | null, Date | null>;
  first_opened_at: ColumnType<Date | null, Date | null, Date | null>;
  last_opened_at: ColumnType<Date | null, Date | null, Date | null>;
  version: ColumnType<bigint, never, never>;
}

export type SelectEntryInteraction = Selectable<EntryInteractionTable>;
export type CreateEntryInteraction = Insertable<EntryInteractionTable>;
export type UpdateEntryInteraction = Updateable<EntryInteractionTable>;

interface EntryPathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectEntryPath = Selectable<EntryPathTable>;
export type CreateEntryPath = Insertable<EntryPathTable>;
export type UpdateEntryPath = Updateable<EntryPathTable>;

interface MessageTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<MessageType, MessageType, MessageType>;
  parent_id: ColumnType<string, string, never>;
  entry_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  content: ColumnType<string, string, never>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date>;
  updated_by: ColumnType<string | null, string | null, string>;
  version: ColumnType<bigint, never, never>;
}

export type SelectMessage = Selectable<MessageTable>;
export type CreateMessage = Insertable<MessageTable>;
export type UpdateMessage = Updateable<MessageTable>;

interface MessageReactionTable {
  message_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, string>;
  created_at: ColumnType<Date, Date, Date>;
  deleted_at: ColumnType<Date | null, Date | null, Date | null>;
  version: ColumnType<bigint, never, never>;
}

export type SelectMessageReaction = Selectable<MessageReactionTable>;
export type CreateMessageReaction = Insertable<MessageReactionTable>;
export type UpdateMessageReaction = Updateable<MessageReactionTable>;

interface MessageInteractionTable {
  message_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  seen_at: ColumnType<Date | null, Date | null, Date | null>;
  first_opened_at: ColumnType<Date | null, Date | null, Date | null>;
  last_opened_at: ColumnType<Date | null, Date | null, Date | null>;
  version: ColumnType<bigint, never, never>;
}

export type SelectMessageInteraction = Selectable<MessageInteractionTable>;
export type CreateMessageInteraction = Insertable<MessageInteractionTable>;
export type UpdateMessageInteraction = Updateable<MessageInteractionTable>;

interface MessageTombstoneTable {
  id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  deleted_at: ColumnType<Date, Date, Date>;
  deleted_by: ColumnType<string, string, never>;
  version: ColumnType<bigint, never, never>;
}

export type SelectMessageTombstone = Selectable<MessageTombstoneTable>;
export type CreateMessageTombstone = Insertable<MessageTombstoneTable>;
export type UpdateMessageTombstone = Updateable<MessageTombstoneTable>;

interface FileTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<FileType, FileType, FileType>;
  parent_id: ColumnType<string, string, never>;
  entry_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  name: ColumnType<string, string, never>;
  original_name: ColumnType<string, string, never>;
  mime_type: ColumnType<string, string, never>;
  extension: ColumnType<string, string, never>;
  size: ColumnType<number, number, never>;
  created_at: ColumnType<Date, Date, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<Date | null, Date | null, Date | null>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  status: ColumnType<FileStatus, FileStatus, FileStatus>;
  version: ColumnType<bigint, never, never>;
}

export type SelectFile = Selectable<FileTable>;
export type CreateFile = Insertable<FileTable>;
export type UpdateFile = Updateable<FileTable>;

interface FileInteractionTable {
  file_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  first_seen_at: ColumnType<Date | null, Date | null, Date | null>;
  last_seen_at: ColumnType<Date | null, Date | null, Date | null>;
  first_opened_at: ColumnType<Date | null, Date | null, Date | null>;
  last_opened_at: ColumnType<Date | null, Date | null, Date | null>;
  version: ColumnType<bigint, never, never>;
}

export type SelectFileInteraction = Selectable<FileInteractionTable>;
export type CreateFileInteraction = Insertable<FileInteractionTable>;
export type UpdateFileInteraction = Updateable<FileInteractionTable>;

interface FileTombstoneTable {
  id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  deleted_at: ColumnType<Date, Date, Date>;
  deleted_by: ColumnType<string, string, never>;
  version: ColumnType<bigint, never, never>;
}

export type SelectFileTombstone = Selectable<FileTombstoneTable>;
export type CreateFileTombstone = Insertable<FileTombstoneTable>;
export type UpdateFileTombstone = Updateable<FileTombstoneTable>;

interface EntryEmbeddingTable {
  entry_id: ColumnType<string, string, never>;
  chunk: ColumnType<number, number, number>;
  parent_id: ColumnType<string | null, string | null, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  text: ColumnType<string, string, string>;
  embedding_vector: ColumnType<number[], number[], number[]>;
  search_vector: ColumnType<never, never, never>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type SelectEntryEmbedding = Selectable<EntryEmbeddingTable>;
export type CreateEntryEmbedding = Insertable<EntryEmbeddingTable>;
export type UpdateEntryEmbedding = Updateable<EntryEmbeddingTable>;

interface MessageEmbeddingTable {
  message_id: ColumnType<string, string, never>;
  chunk: ColumnType<number, number, number>;
  parent_id: ColumnType<string, string, never>;
  entry_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  text: ColumnType<string, string, string>;
  embedding_vector: ColumnType<number[], number[], number[]>;
  search_vector: ColumnType<never, never, never>;
  created_at: ColumnType<Date, Date, never>;
  updated_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type SelectMessageEmbedding = Selectable<MessageEmbeddingTable>;
export type CreateMessageEmbedding = Insertable<MessageEmbeddingTable>;
export type UpdateMessageEmbedding = Updateable<MessageEmbeddingTable>;

export interface DatabaseSchema {
  accounts: AccountTable;
  devices: DeviceTable;
  workspaces: WorkspaceTable;
  users: UserTable;
  entries: EntryTable;
  entry_transactions: EntryTransactionTable;
  entry_interactions: EntryInteractionTable;
  entry_paths: EntryPathTable;
  messages: MessageTable;
  message_reactions: MessageReactionTable;
  message_interactions: MessageInteractionTable;
  message_tombstones: MessageTombstoneTable;
  files: FileTable;
  file_interactions: FileInteractionTable;
  file_tombstones: FileTombstoneTable;
  collaborations: CollaborationTable;
  entry_embeddings: EntryEmbeddingTable;
  message_embeddings: MessageEmbeddingTable;
}
