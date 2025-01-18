import {
  canDeleteFile,
  DeleteFileMutationData,
  generateId,
  IdType,
} from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  FileDeleteMutationInput,
  FileDeleteMutationOutput,
} from '@/shared/mutations/files/file-delete';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchEntry } from '@/main/lib/utils';
import { mapEntry, mapFile } from '@/main/lib/mappers';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class FileDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDeleteMutationInput>
{
  async handleMutation(
    input: FileDeleteMutationInput
  ): Promise<FileDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const file = await workspace.database
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

    const entry = await fetchEntry(workspace.database, file.root_id);
    if (!entry) {
      throw new MutationError(
        MutationErrorCode.EntryNotFound,
        'There was an error while fetching the entry. Please make sure you have access to this entry.'
      );
    }

    const root = await fetchEntry(workspace.database, entry.root_id);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canDeleteFile({
        user: {
          userId: workspace.userId,
          role: workspace.role,
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

    await workspace.database.transaction().execute(async (tx) => {
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

    workspace.mutations.triggerSync();

    eventBus.publish({
      type: 'file_deleted',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      file: mapFile(file),
    });

    return {
      success: true,
    };
  }
}
