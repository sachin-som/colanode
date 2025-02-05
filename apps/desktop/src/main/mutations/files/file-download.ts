import { FileStatus } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { mapFile } from '@/main/lib/mappers';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@/shared/mutations/files/file-download';
import { DownloadStatus } from '@/shared/types/files';
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

    if (
      file.download_status === DownloadStatus.Completed ||
      file.download_status === DownloadStatus.Pending
    ) {
      return {
        success: true,
      };
    }

    const updatedFile = await workspace.database
      .updateTable('files')
      .returningAll()
      .set({
        download_status: DownloadStatus.Pending,
        download_progress: 0,
        download_retries: 0,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!updatedFile) {
      throw new MutationError(
        MutationErrorCode.FileNotFound,
        'The file you are trying to download does not exist.'
      );
    }

    workspace.files.triggerDownloads();

    eventBus.publish({
      type: 'file_updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      file: mapFile(updatedFile),
    });

    return {
      success: true,
    };
  }
}
