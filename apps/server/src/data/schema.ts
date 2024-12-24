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
  version_id: ColumnType<string, string, string>;
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
  parent_id: ColumnType<string, never, never>;
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

interface TransactionTable {
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

export type SelectTransaction = Selectable<TransactionTable>;
export type CreateTransaction = Insertable<TransactionTable>;
export type UpdateTransaction = Updateable<TransactionTable>;

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
  deleted_at: ColumnType<Date | null, Date | null, Date>;
  deleted_by: ColumnType<string | null, string | null, string>;
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
  deleted_at: ColumnType<Date | null, Date | null, Date | null>;
  deleted_by: ColumnType<string | null, string | null, string | null>;
  status: ColumnType<FileStatus, FileStatus, FileStatus>;
  version: ColumnType<bigint, never, never>;
}

export type SelectFile = Selectable<FileTable>;
export type CreateFile = Insertable<FileTable>;
export type UpdateFile = Updateable<FileTable>;

interface EntryPathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  workspace_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectEntryPath = Selectable<EntryPathTable>;
export type CreateEntryPath = Insertable<EntryPathTable>;
export type UpdateEntryPath = Updateable<EntryPathTable>;

export interface DatabaseSchema {
  accounts: AccountTable;
  devices: DeviceTable;
  workspaces: WorkspaceTable;
  users: UserTable;
  entries: EntryTable;
  transactions: TransactionTable;
  messages: MessageTable;
  message_reactions: MessageReactionTable;
  collaborations: CollaborationTable;
  files: FileTable;
  entry_paths: EntryPathTable;
}
