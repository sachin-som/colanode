import {
  LocalTransaction,
  Mutation,
  Entry,
  TransactionOperation,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';
import {
  DeleteResult,
  InsertResult,
  Kysely,
  Transaction,
  UpdateResult,
} from 'kysely';

import { app } from 'electron';
import path from 'path';

import { databaseService } from './data/database-service';

import {
  SelectAccount,
  SelectServer,
  SelectWorkspace,
} from '@/main/data/app/schema';
import {
  SelectFile,
  SelectFileState,
  SelectMessage,
  SelectMessageReaction,
  SelectMutation,
  SelectEntry,
  SelectEntryTransaction,
  SelectUser,
  WorkspaceDatabaseSchema,
  SelectMessageInteraction,
  SelectFileInteraction,
  SelectEntryInteraction,
} from '@/main/data/workspace/schema';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';
import { User } from '@/shared/types/users';
import { File, FileInteraction, FileState } from '@/shared/types/files';
import { Workspace, WorkspaceCredentials } from '@/shared/types/workspaces';
import {
  MessageInteraction,
  MessageNode,
  MessageReaction,
} from '@/shared/types/messages';
import { EntryInteraction } from '@/shared/types/entries';

export const appPath = app.getPath('userData');

export const appDatabasePath = path.join(appPath, 'app.db');

export const getWorkspaceDirectoryPath = (userId: string): string => {
  return path.join(appPath, 'workspaces', userId);
};

export const getWorkspaceFilesDirectoryPath = (userId: string): string => {
  return path.join(getWorkspaceDirectoryPath(userId), 'files');
};

export const getWorkspaceTempFilesDirectoryPath = (userId: string): string => {
  return path.join(getWorkspaceDirectoryPath(userId), 'temp');
};

export const getAccountAvatarsDirectoryPath = (accountId: string): string => {
  return path.join(appPath, 'avatars', accountId);
};

export const getAssetsSourcePath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets');
  }

  return path.resolve(__dirname, '../../assets');
};

export const getAppIconPath = (): string => {
  return path.join(getAssetsSourcePath(), 'colanode_logo_black.png');
};

export const hasInsertChanges = (result: InsertResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some(
    (r) => r.numInsertedOrUpdatedRows && r.numInsertedOrUpdatedRows > 0n
  );
};

export const hasUpdateChanges = (result: UpdateResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some((r) => r.numUpdatedRows && r.numUpdatedRows > 0n);
};

export const hasDeleteChanges = (result: DeleteResult[]): boolean => {
  return result.some((r) => r.numDeletedRows && r.numDeletedRows > 0n);
};

export const fetchEntryAncestors = (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  entryId: string
): Promise<SelectEntry[]> => {
  return database
    .selectFrom('entries')
    .selectAll()
    .where(
      'id',
      'in',
      database
        .selectFrom('entry_paths')
        .select('ancestor_id')
        .where('descendant_id', '=', entryId)
    )
    .execute();
};

export const fetchEntry = (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  entryId: string
): Promise<SelectEntry | undefined> => {
  return database
    .selectFrom('entries')
    .selectAll()
    .where('id', '=', entryId)
    .executeTakeFirst();
};

export const fetchUser = (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  userId: string
): Promise<SelectUser | undefined> => {
  return database
    .selectFrom('users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst();
};

export const fetchWorkspaceCredentials = async (
  userId: string
): Promise<WorkspaceCredentials | null> => {
  const workspace = await databaseService.appDatabase
    .selectFrom('workspaces')
    .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
    .innerJoin('servers', 'accounts.server', 'servers.domain')
    .select([
      'workspaces.workspace_id',
      'workspaces.user_id',
      'workspaces.account_id',
      'accounts.token',
      'servers.domain',
      'servers.attributes',
    ])
    .where('workspaces.user_id', '=', userId)
    .executeTakeFirst();

  if (!workspace) {
    return null;
  }

  return {
    workspaceId: workspace.workspace_id,
    accountId: workspace.account_id,
    userId: workspace.user_id,
    token: workspace.token,
    serverDomain: workspace.domain,
    serverAttributes: workspace.attributes,
  };
};

export const mapUser = (row: SelectUser): User => {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    customName: row.custom_name,
    customAvatar: row.custom_avatar,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapEntry = (row: SelectEntry): Entry => {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    rootId: row.root_id,
    attributes: JSON.parse(row.attributes),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    transactionId: row.transaction_id,
  };
};

export const mapAccount = (row: SelectAccount): Account => {
  return {
    id: row.id,
    server: row.server,
    name: row.name,
    avatar: row.avatar,
    deviceId: row.device_id,
    email: row.email,
    token: row.token,
    status: row.status,
  };
};

export const mapWorkspace = (row: SelectWorkspace): Workspace => {
  return {
    id: row.workspace_id,
    name: row.name,
    accountId: row.account_id,
    role: row.role,
    userId: row.user_id,
    avatar: row.avatar,
    description: row.description,
  };
};

export const mapEntryTransaction = (
  row: SelectEntryTransaction
): LocalTransaction => {
  if (row.operation === TransactionOperation.Create && row.data) {
    return {
      id: row.id,
      entryId: row.entry_id,
      rootId: row.root_id,
      operation: TransactionOperation.Create,
      data: encodeState(row.data),
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }

  if (row.operation === TransactionOperation.Update && row.data) {
    return {
      id: row.id,
      entryId: row.entry_id,
      rootId: row.root_id,
      operation: TransactionOperation.Update,
      data: encodeState(row.data),
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }

  if (row.operation === TransactionOperation.Delete) {
    return {
      id: row.id,
      entryId: row.entry_id,
      rootId: row.root_id,
      operation: TransactionOperation.Delete,
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }

  throw new Error('Invalid transaction type');
};

export const mapMutation = (row: SelectMutation): Mutation => {
  return {
    id: row.id,
    type: row.type,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
  };
};

export const mapServer = (row: SelectServer): Server => {
  return {
    domain: row.domain,
    name: row.name,
    avatar: row.avatar,
    attributes: JSON.parse(row.attributes),
    version: row.version,
    createdAt: new Date(row.created_at),
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
  };
};

export const mapMessage = (row: SelectMessage): MessageNode => {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    rootId: row.root_id,
    attributes: JSON.parse(row.attributes),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    version: row.version,
  };
};

export const mapMessageReaction = (
  row: SelectMessageReaction
): MessageReaction => {
  return {
    messageId: row.message_id,
    collaboratorId: row.collaborator_id,
    reaction: row.reaction,
    rootId: row.root_id,
    createdAt: row.created_at,
  };
};

export const mapMessageInteraction = (
  row: SelectMessageInteraction
): MessageInteraction => {
  return {
    messageId: row.message_id,
    collaboratorId: row.collaborator_id,
    rootId: row.root_id,
    seenAt: row.seen_at,
    lastOpenedAt: row.last_opened_at,
    version: row.version,
  };
};

export const mapFile = (row: SelectFile): File => {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    entryId: row.entry_id,
    rootId: row.root_id,
    name: row.name,
    originalName: row.original_name,
    extension: row.extension,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    status: row.status,
    version: row.version,
  };
};

export const mapFileState = (row: SelectFileState): FileState => {
  return {
    fileId: row.file_id,
    downloadProgress: row.download_progress,
    downloadStatus: row.download_status,
    downloadRetries: row.download_retries,
    uploadProgress: row.upload_progress,
    uploadStatus: row.upload_status,
    uploadRetries: row.upload_retries,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapFileInteraction = (
  row: SelectFileInteraction
): FileInteraction => {
  return {
    fileId: row.file_id,
    collaboratorId: row.collaborator_id,
    rootId: row.root_id,
    lastSeenAt: row.last_seen_at,
    firstSeenAt: row.first_seen_at,
    lastOpenedAt: row.last_opened_at,
    firstOpenedAt: row.first_opened_at,
    version: row.version,
  };
};

export const mapEntryInteraction = (
  row: SelectEntryInteraction
): EntryInteraction => {
  return {
    entryId: row.entry_id,
    collaboratorId: row.collaborator_id,
    rootId: row.root_id,
    lastSeenAt: row.last_seen_at,
    firstSeenAt: row.first_seen_at,
    lastOpenedAt: row.last_opened_at,
    firstOpenedAt: row.first_opened_at,
    version: row.version,
  };
};
