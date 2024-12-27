import { DeleteFileMutationData, generateId, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  FileDeleteMutationInput,
  FileDeleteMutationOutput,
} from '@/shared/mutations/files/file-delete';
import { eventBus } from '@/shared/lib/event-bus';
import { mapFile } from '@/main/utils';

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
      return {
        success: true,
      };
    }

    const deletedAt = new Date().toISOString();
    const deleteFileMutationData: DeleteFileMutationData = {
      id: input.fileId,
      rootId: file.root_id,
      deletedAt,
    };

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx.deleteFrom('files').where('id', '=', input.fileId).execute();

      await tx
        .insertInto('mutations')
        .values({
          id: generateId(IdType.Mutation),
          type: 'delete_file',
          node_id: input.fileId,
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
