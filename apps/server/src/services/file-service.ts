import {
  CreateFileMutation,
  extractEntryRole,
  FileStatus,
  hasCollaboratorAccess,
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
}

export const fileService = new FileService();
