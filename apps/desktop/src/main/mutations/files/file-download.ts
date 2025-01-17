import { FileStatus } from '@colanode/core';

import { MutationHandler } from '@/main/types';
import { mapFileState } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@/shared/mutations/files/file-download';
import { DownloadStatus, UploadStatus } from '@/shared/types/files';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class FileDownloadMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDownloadMutationInput>
{
  async handleMutation(
    input: FileDownloadMutationInput
  ): Promise<FileDownloadMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const file = await workspace.database
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

    const existingFileState = await workspace.database
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

    const fileState = await workspace.database
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
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      fileState: mapFileState(fileState),
    });

    return {
      success: true,
    };
  }
}
