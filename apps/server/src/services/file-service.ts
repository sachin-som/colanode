import {
  CreateFileMutation,
  DeleteFileMutation,
  extractEntryRole,
  FileStatus,
  hasCollaboratorAccess,
  hasViewerAccess,
  MarkFileOpenedMutation,
  MarkFileSeenMutation,
} from '@colanode/core';

import { database } from '@/data/database';
import { SelectUser } from '@/data/schema';
import { mapEntry } from '@/lib/entries';
import { eventBus } from '@/lib/event-bus';

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

    const root = await database
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', mutation.data.rootId)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!hasCollaboratorAccess(role)) {
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

    const root = await database
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', mutation.data.rootId)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!hasCollaboratorAccess(role)) {
      return false;
    }

    const deletedFile = await database
      .updateTable('files')
      .returningAll()
      .set({
        deleted_at: new Date(mutation.data.deletedAt),
        deleted_by: user.id,
      })
      .where('id', '=', mutation.data.id)
      .executeTakeFirst();

    if (!deletedFile) {
      return false;
    }

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

    const root = await database
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', file.root_id)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!hasViewerAccess(role)) {
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
      .select(['id', 'root_id', 'workspace_id'])
      .where('id', '=', mutation.data.fileId)
      .executeTakeFirst();

    if (!file) {
      return false;
    }

    const root = await database
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', file.root_id)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!hasViewerAccess(role)) {
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
