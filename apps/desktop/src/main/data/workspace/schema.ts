import {
  FileStatus,
  FileType,
  MutationType,
  EntryType,
  WorkspaceRole,
  MessageType,
  TransactionOperation,
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
  storage_limit: ColumnType<bigint, bigint, bigint>;
  max_file_size: ColumnType<bigint, bigint, bigint>;
  status: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectUser = Selectable<UserTable>;
export type CreateUser = Insertable<UserTable>;
export type UpdateUser = Updateable<UserTable>;

interface EntryTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<EntryType, never, never>;
  parent_id: ColumnType<string | null, never, never>;
  root_id: ColumnType<string, string, never>;
  attributes: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  transaction_id: ColumnType<string, string, string>;
}

export type SelectEntry = Selectable<EntryTable>;
export type CreateEntry = Insertable<EntryTable>;
export type UpdateEntry = Updateable<EntryTable>;

interface EntryPathTable {
  ancestor_id: ColumnType<string, string, never>;
  descendant_id: ColumnType<string, string, never>;
  level: ColumnType<number, number, number>;
}

export type SelectEntryPath = Selectable<EntryPathTable>;

interface EntryTransactionTable {
  id: ColumnType<string, string, never>;
  entry_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  operation: ColumnType<TransactionOperation, TransactionOperation, never>;
  data: ColumnType<Uint8Array | null, Uint8Array | null, never>;
  created_at: ColumnType<string, string, never>;
  created_by: ColumnType<string, string, never>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectEntryTransaction = Selectable<EntryTransactionTable>;
export type CreateEntryTransaction = Insertable<EntryTransactionTable>;
export type UpdateEntryTransaction = Updateable<EntryTransactionTable>;

interface EntryInteractionTable {
  entry_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, never>;
  first_seen_at: ColumnType<string | null, string | null, string | null>;
  last_seen_at: ColumnType<string | null, string | null, string | null>;
  first_opened_at: ColumnType<string | null, string | null, string | null>;
  last_opened_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectEntryInteraction = Selectable<EntryInteractionTable>;
export type CreateEntryInteraction = Insertable<EntryInteractionTable>;
export type UpdateEntryInteraction = Updateable<EntryInteractionTable>;

interface CollaborationTable {
  entry_id: ColumnType<string, string, never>;
  role: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectCollaboration = Selectable<CollaborationTable>;
export type CreateCollaboration = Insertable<CollaborationTable>;
export type UpdateCollaboration = Updateable<CollaborationTable>;

interface MessageTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<MessageType, never, never>;
  parent_id: ColumnType<string, string, string>;
  entry_id: ColumnType<string, string, string>;
  root_id: ColumnType<string, string, string>;
  attributes: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<string | null, never, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectMessage = Selectable<MessageTable>;
export type CreateMessage = Insertable<MessageTable>;
export type UpdateMessage = Updateable<MessageTable>;

interface MessageReactionTable {
  message_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, string>;
  root_id: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  deleted_at: ColumnType<string | null, never, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectMessageReaction = Selectable<MessageReactionTable>;
export type CreateMessageReaction = Insertable<MessageReactionTable>;
export type UpdateMessageReaction = Updateable<MessageReactionTable>;

interface MessageInteractionTable {
  message_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, string>;
  seen_at: ColumnType<string | null, string | null, string | null>;
  first_opened_at: ColumnType<string | null, string | null, string | null>;
  last_opened_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectMessageInteraction = Selectable<MessageInteractionTable>;
export type CreateMessageInteraction = Insertable<MessageInteractionTable>;
export type UpdateMessageInteraction = Updateable<MessageInteractionTable>;

interface FileTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<FileType, FileType, FileType>;
  parent_id: ColumnType<string, string, string>;
  entry_id: ColumnType<string, string, string>;
  root_id: ColumnType<string, string, string>;
  name: ColumnType<string, string, string>;
  original_name: ColumnType<string, string, string>;
  mime_type: ColumnType<string, string, string>;
  extension: ColumnType<string, string, string>;
  size: ColumnType<number, number, number>;
  created_at: ColumnType<string, string, never>;
  created_by: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  deleted_at: ColumnType<string | null, never, string | null>;
  status: ColumnType<FileStatus, FileStatus, FileStatus>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectFile = Selectable<FileTable>;
export type CreateFile = Insertable<FileTable>;
export type UpdateFile = Updateable<FileTable>;

interface FileStateTable {
  file_id: ColumnType<string, string, never>;
  download_status: ColumnType<DownloadStatus, DownloadStatus, DownloadStatus>;
  download_progress: ColumnType<number, number, number>;
  download_retries: ColumnType<number, number, number>;
  upload_status: ColumnType<UploadStatus, UploadStatus, UploadStatus>;
  upload_progress: ColumnType<number, number, number>;
  upload_retries: ColumnType<number, number, number>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string>;
}

export type SelectFileState = Selectable<FileStateTable>;
export type CreateFileState = Insertable<FileStateTable>;
export type UpdateFileState = Updateable<FileStateTable>;

interface FileInteractionTable {
  file_id: ColumnType<string, string, never>;
  collaborator_id: ColumnType<string, string, never>;
  root_id: ColumnType<string, string, string>;
  first_seen_at: ColumnType<string | null, string | null, string | null>;
  last_seen_at: ColumnType<string | null, string | null, string | null>;
  first_opened_at: ColumnType<string | null, string | null, string | null>;
  last_opened_at: ColumnType<string | null, string | null, string | null>;
  version: ColumnType<bigint, bigint, bigint>;
}

export type SelectFileInteraction = Selectable<FileInteractionTable>;
export type CreateFileInteraction = Insertable<FileInteractionTable>;
export type UpdateFileInteraction = Updateable<FileInteractionTable>;

interface MutationTable {
  id: ColumnType<string, string, never>;
  type: ColumnType<MutationType, MutationType, never>;
  node_id: ColumnType<string, string, never>;
  data: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  retries: ColumnType<number, number, number>;
}

export type SelectMutation = Selectable<MutationTable>;
export type CreateMutation = Insertable<MutationTable>;
export type UpdateMutation = Updateable<MutationTable>;

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

export interface WorkspaceDatabaseSchema {
  users: UserTable;
  entries: EntryTable;
  entry_interactions: EntryInteractionTable;
  entry_transactions: EntryTransactionTable;
  entry_paths: EntryPathTable;
  collaborations: CollaborationTable;
  messages: MessageTable;
  message_reactions: MessageReactionTable;
  message_interactions: MessageInteractionTable;
  files: FileTable;
  file_states: FileStateTable;
  file_interactions: FileInteractionTable;
  mutations: MutationTable;
  texts: TextTable;
  cursors: CursorTable;
}
