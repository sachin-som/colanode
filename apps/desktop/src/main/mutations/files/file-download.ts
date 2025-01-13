import { FileStatus } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { mapFileState } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@/shared/mutations/files/file-download';
import { DownloadStatus, UploadStatus } from '@/shared/types/files';

export class FileDownloadMutationHandler
  implements MutationHandler<FileDownloadMutationInput>
{
  async handleMutation(
    input: FileDownloadMutationInput
  ): Promise<FileDownloadMutationOutput> {
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
        'The file you are trying to download does not exist.'
      );
    }

    if (file.status !== FileStatus.Ready) {
      throw new MutationError(
        MutationErrorCode.FileNotReady,
        'The file you are trying to download is not uploaded by the author yet.'
      );
    }

    const existingFileState = await workspaceDatabase
      .selectFrom('file_states')
      .selectAll()
      .where('file_id', '=', input.fileId)
      .executeTakeFirst();

    if (
      existingFileState &&
      existingFileState.download_status === DownloadStatus.Completed
    ) {
      return {
        success: true,
      };
    }

    const fileState = await workspaceDatabase
      .insertInto('file_states')
      .returningAll()
      .values({
        file_id: input.fileId,
        download_status: DownloadStatus.Pending,
        download_progress: 0,
        download_retries: 0,
        upload_status: UploadStatus.None,
        upload_progress: 0,
        upload_retries: 0,
        created_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.doUpdateSet(() => ({
          download_status: DownloadStatus.Pending,
          download_progress: 0,
          download_retries: 0,
          updated_at: new Date().toISOString(),
        }))
      )
      .executeTakeFirst();

    if (!fileState) {
      throw new Error('Failed to create file state.');
    }

    eventBus.publish({
      type: 'file_state_created',
      userId: input.userId,
      fileState: mapFileState(fileState),
    });

    return {
      success: true,
    };
  }
}
