import { extractFileType, getIdType, IdType } from '@colanode/core';
import {
  DeleteResult,
  InsertResult,
  Kysely,
  Transaction,
  UpdateResult,
} from 'kysely';
import mime from 'mime-types';

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

import {
  SelectEntry,
  WorkspaceDatabaseSchema,
} from '@/main/databases/workspace';
import { FileMetadata } from '@/shared/types/files';

export const appPath = app.getPath('userData');

export const appDatabasePath = path.join(appPath, 'app.db');

export const getAccountDirectoryPath = (accountId: string): string => {
  return path.join(appPath, 'accounts', accountId);
};

export const getWorkspaceDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(
    getAccountDirectoryPath(accountId),
    'workspaces',
    workspaceId
  );
};

export const getWorkspaceFilesDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(getWorkspaceDirectoryPath(accountId, workspaceId), 'files');
};

export const getWorkspaceTempFilesDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(getWorkspaceDirectoryPath(accountId, workspaceId), 'temp');
};

export const getAccountAvatarsDirectoryPath = (accountId: string): string => {
  return path.join(getAccountDirectoryPath(accountId), 'avatars');
};

export const getAssetsSourcePath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets');
  }

  return path.resolve(__dirname, '../../assets');
};

export const getAppIconPath = (): string => {
  return path.join(getAssetsSourcePath(), 'colanode-logo-black.png');
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

export const getFileMetadata = (filePath: string): FileMetadata | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const mimeType = mime.lookup(filePath);
  if (mimeType === false) {
    return null;
  }

  const stats = fs.statSync(filePath);
  const type = extractFileType(mimeType);

  return {
    path: filePath,
    mimeType,
    extension: path.extname(filePath),
    name: path.basename(filePath),
    size: stats.size,
    type,
  };
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

export const fetchUserStorageUsed = async (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  userId: string
): Promise<bigint> => {
  const storageUsedRow = await database
    .selectFrom('files')
    .select(({ fn }) => [fn.sum('size').as('storage_used')])
    .where('created_by', '=', userId)
    .executeTakeFirst();

  return BigInt(storageUsedRow?.storage_used ?? 0);
};

export const fetchEntryBreadcrumb = async (
  database: Kysely<WorkspaceDatabaseSchema>,
  entryId: string
): Promise<string[]> => {
  const rows = await database
    .selectFrom('entry_paths')
    .select('ancestor_id')
    .where('descendant_id', '=', entryId)
    .orderBy('level', 'desc')
    .execute();

  return rows.map((row) => row.ancestor_id);
};

export const fetchMessageBreadcrumb = async (
  database: Kysely<WorkspaceDatabaseSchema>,
  messageId: string
): Promise<string[]> => {
  const message = await database
    .selectFrom('messages')
    .select('parent_id')
    .where('id', '=', messageId)
    .executeTakeFirst();

  if (!message) {
    return [];
  }

  const parentIdType = getIdType(message.parent_id);
  if (parentIdType === IdType.Message) {
    const messageBreadcrumb = await fetchMessageBreadcrumb(
      database,
      message.parent_id
    );

    return [...messageBreadcrumb, messageId];
  }

  const entryBreadcrumb = await fetchEntryBreadcrumb(
    database,
    message.parent_id
  );
  return [...entryBreadcrumb, messageId];
};

export const fetchFileBreadcrumb = async (
  database: Kysely<WorkspaceDatabaseSchema>,
  fileId: string
): Promise<string[]> => {
  const file = await database
    .selectFrom('files')
    .select('parent_id')
    .where('id', '=', fileId)
    .executeTakeFirst();

  if (!file) {
    return [];
  }

  const parentIdType = getIdType(file.parent_id);
  if (parentIdType === IdType.Message) {
    const messageBreadcrumb = await fetchMessageBreadcrumb(
      database,
      file.parent_id
    );

    return [...messageBreadcrumb, fileId];
  }

  const entryBreadcrumb = await fetchEntryBreadcrumb(database, file.parent_id);
  return [...entryBreadcrumb, fileId];
};
