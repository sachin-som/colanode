import {
  canDeleteFile,
  DeleteFileMutationData,
  generateId,
  IdType,
} from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  FileDeleteMutationInput,
  FileDeleteMutationOutput,
} from '@/shared/mutations/files/file-delete';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchEntry, fetchUser, mapEntry, mapFile } from '@/main/utils';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class FileDeleteMutationHandler
  implements MutationHandler<FileDeleteMutationInput>
{
  async handleMutation(
    input: FileDeleteMutationInput
  ): Promise<FileDeleteMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const file = await workspaceDatabase
      .selectFrom('files')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!file) {
      throw new MutationError(
        MutationErrorCode.FileNotFound,
        'File could not be found or has been already deleted.'
      );
    }

    const user = await fetchUser(workspaceDatabase, input.userId);
    if (!user) {
      throw new MutationError(
        MutationErrorCode.UserNotFound,
        'There was an error while fetching the user. Please make sure you are logged in.'
      );
    }

    const entry = await fetchEntry(workspaceDatabase, file.root_id);
    if (!entry) {
      throw new MutationError(
        MutationErrorCode.EntryNotFound,
        'There was an error while fetching the entry. Please make sure you have access to this entry.'
      );
    }

    const root = await fetchEntry(workspaceDatabase, entry.root_id);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canDeleteFile({
        user: {
          userId: input.userId,
          role: user.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
        file: {
          id: input.fileId,
          parentId: file.parent_id,
          createdBy: file.created_by,
        },
      })
    ) {
      throw new MutationError(
        MutationErrorCode.FileDeleteForbidden,
        'You are not allowed to delete this file.'
      );
    }

    const deletedAt = new Date().toISOString();
    const deleteFileMutationData: DeleteFileMutationData = {
      id: input.fileId,
      rootId: file.root_id,
      deletedAt,
    };

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx
        .updateTable('files')
        .set({
          deleted_at: deletedAt,
        })
        .where('id', '=', input.fileId)
        .execute();

      await tx
        .insertInto('mutations')
        .values({
          id: generateId(IdType.Mutation),
          type: 'delete_file',
          data: JSON.stringify(deleteFileMutationData),
          created_at: deletedAt,
          retries: 0,
        })
        .execute();
    });

    eventBus.publish({
      type: 'file_deleted',
      userId: input.userId,
      file: mapFile(file),
    });

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    return {
      success: true,
    };
  }
}
