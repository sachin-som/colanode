import {
  canCreateFile,
  canDeleteFile,
  CreateFileMutation,
  DeleteFileMutation,
  extractEntryRole,
  FileStatus,
  hasEntryRole,
  MarkFileOpenedMutation,
  MarkFileSeenMutation,
} from '@colanode/core';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import { database } from '@/data/database';
import { SelectUser } from '@/data/schema';
import { fetchEntry, mapEntry } from '@/lib/entries';
import { eventBus } from '@/lib/event-bus';
import { fileS3 } from '@/data/storage';
import { configuration } from '@/lib/configuration';

class FileService {
  public async createFile(
    user: SelectUser,
    mutation: CreateFileMutation
  ): Promise<boolean> {
    const existingFile = await database
      .selectFrom('files')
      .where('id', '=', mutation.data.id)
      .executeTakeFirst();

    if (existingFile) {
      return true;
    }

    const entry = await fetchEntry(mutation.data.entryId);
    if (!entry) {
      return false;
    }

    const root = await fetchEntry(mutation.data.rootId);
    if (!root) {
      return false;
    }

    if (
      !canCreateFile({
        user: {
          userId: user.id,
          role: user.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
        file: {
          id: mutation.data.id,
          parentId: mutation.data.parentId,
        },
      })
    ) {
      return false;
    }

    if (mutation.data.size > user.max_file_size) {
      return false;
    }

    const storageUsedRow = await database
      .selectFrom('files')
      .select(({ fn }) => [fn.sum('size').as('storage_used')])
      .where('created_by', '=', user.id)
      .executeTakeFirst();

    const storageUsed = BigInt(storageUsedRow?.storage_used ?? 0);

    if (storageUsed + BigInt(mutation.data.size) > user.storage_limit) {
      return false;
    }

    const createdFile = await database
      .insertInto('files')
      .returningAll()
      .values({
        id: mutation.data.id,
        type: mutation.data.type,
        parent_id: mutation.data.parentId,
        entry_id: mutation.data.entryId,
        root_id: mutation.data.rootId,
        workspace_id: root.workspace_id,
        name: mutation.data.name,
        original_name: mutation.data.originalName,
        extension: mutation.data.extension,
        mime_type: mutation.data.mimeType,
        size: mutation.data.size,
        created_by: user.id,
        created_at: new Date(mutation.data.createdAt),
        status: FileStatus.Pending,
      })
      .executeTakeFirst();

    if (!createdFile) {
      return false;
    }

    eventBus.publish({
      type: 'file_created',
      fileId: createdFile.id,
      rootId: createdFile.root_id,
      workspaceId: createdFile.workspace_id,
    });

    return true;
  }

  public async deleteFile(
    user: SelectUser,
    mutation: DeleteFileMutation
  ): Promise<boolean> {
    const file = await database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', mutation.data.id)
      .executeTakeFirst();

    if (!file) {
      return true;
    }

    const entry = await fetchEntry(file.entry_id);
    if (!entry) {
      return false;
    }

    const root = await fetchEntry(file.root_id);
    if (!root) {
      return false;
    }

    if (
      !canDeleteFile({
        user: {
          userId: user.id,
          role: user.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
        file: {
          id: mutation.data.id,
          parentId: file.parent_id,
          createdBy: file.created_by,
        },
      })
    ) {
      return false;
    }

    const deletedFile = await database.transaction().execute(async (tx) => {
      const deletedFile = await tx
        .deleteFrom('files')
        .returningAll()
        .where('id', '=', mutation.data.id)
        .executeTakeFirst();

      if (!deletedFile) {
        return null;
      }

      await tx
        .deleteFrom('file_interactions')
        .where('file_id', '=', deletedFile.id)
        .execute();

      await tx
        .insertInto('file_tombstones')
        .values({
          id: deletedFile.id,
          root_id: deletedFile.root_id,
          workspace_id: deletedFile.workspace_id,
          deleted_at: new Date(mutation.data.deletedAt),
          deleted_by: user.id,
        })
        .executeTakeFirst();

      return deletedFile;
    });

    if (!deletedFile) {
      return false;
    }

    const path = `files/${deletedFile.workspace_id}/${deletedFile.id}${deletedFile.extension}`;
    const command = new DeleteObjectCommand({
      Bucket: configuration.fileS3.bucketName,
      Key: path,
    });

    await fileS3.send(command);

    eventBus.publish({
      type: 'file_deleted',
      fileId: deletedFile.id,
      rootId: deletedFile.root_id,
      workspaceId: deletedFile.workspace_id,
    });

    return true;
  }

  public async markFileAsSeen(
    user: SelectUser,
    mutation: MarkFileSeenMutation
  ): Promise<boolean> {
    const file = await database
      .selectFrom('files')
      .select(['id', 'root_id', 'workspace_id'])
      .where('id', '=', mutation.data.fileId)
      .executeTakeFirst();

    if (!file) {
      return false;
    }

    const root = await fetchEntry(file.root_id);
    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!role || !hasEntryRole(role, 'viewer')) {
      return false;
    }

    const existingInteraction = await database
      .selectFrom('file_interactions')
      .selectAll()
      .where('file_id', '=', mutation.data.fileId)
      .where('collaborator_id', '=', user.id)
      .executeTakeFirst();

    if (
      existingInteraction &&
      existingInteraction.last_seen_at !== null &&
      existingInteraction.last_seen_at <= new Date(mutation.data.seenAt)
    ) {
      return true;
    }

    const lastSeenAt = new Date(mutation.data.seenAt);
    const firstSeenAt = existingInteraction?.first_seen_at ?? lastSeenAt;
    const createdInteraction = await database
      .insertInto('file_interactions')
      .returningAll()
      .values({
        file_id: mutation.data.fileId,
        collaborator_id: user.id,
        first_seen_at: firstSeenAt,
        last_seen_at: lastSeenAt,
        root_id: root.id,
        workspace_id: root.workspace_id,
      })
      .onConflict((b) =>
        b.columns(['file_id', 'collaborator_id']).doUpdateSet({
          last_seen_at: lastSeenAt,
          first_seen_at: firstSeenAt,
        })
      )
      .executeTakeFirst();

    if (!createdInteraction) {
      return false;
    }

    eventBus.publish({
      type: 'file_interaction_updated',
      fileId: createdInteraction.file_id,
      collaboratorId: createdInteraction.collaborator_id,
      rootId: createdInteraction.root_id,
      workspaceId: createdInteraction.workspace_id,
    });

    return true;
  }

  public async markFileAsOpened(
    user: SelectUser,
    mutation: MarkFileOpenedMutation
  ): Promise<boolean> {
    const file = await database
      .selectFrom('files')
      .select(['id', 'entry_id', 'root_id', 'workspace_id'])
      .where('id', '=', mutation.data.fileId)
      .executeTakeFirst();

    if (!file) {
      return false;
    }

    const root = await fetchEntry(file.root_id);
    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!role || !hasEntryRole(role, 'viewer')) {
      return false;
    }

    const existingInteraction = await database
      .selectFrom('file_interactions')
      .selectAll()
      .where('file_id', '=', mutation.data.fileId)
      .where('collaborator_id', '=', user.id)
      .executeTakeFirst();

    if (
      existingInteraction &&
      existingInteraction.last_opened_at !== null &&
      existingInteraction.last_opened_at <= new Date(mutation.data.openedAt)
    ) {
      return true;
    }

    const lastOpenedAt = new Date(mutation.data.openedAt);
    const firstOpenedAt = existingInteraction?.first_opened_at ?? lastOpenedAt;
    const createdInteraction = await database
      .insertInto('file_interactions')
      .returningAll()
      .values({
        file_id: mutation.data.fileId,
        collaborator_id: user.id,
        first_opened_at: firstOpenedAt,
        last_opened_at: lastOpenedAt,
        root_id: root.id,
        workspace_id: root.workspace_id,
      })
      .onConflict((b) =>
        b.columns(['file_id', 'collaborator_id']).doUpdateSet({
          last_opened_at: lastOpenedAt,
          first_opened_at: firstOpenedAt,
        })
      )
      .executeTakeFirst();

    if (!createdInteraction) {
      return false;
    }

    eventBus.publish({
      type: 'file_interaction_updated',
      fileId: createdInteraction.file_id,
      collaboratorId: createdInteraction.collaborator_id,
      rootId: createdInteraction.root_id,
      workspaceId: createdInteraction.workspace_id,
    });

    return true;
  }
}

export const fileService = new FileService();
