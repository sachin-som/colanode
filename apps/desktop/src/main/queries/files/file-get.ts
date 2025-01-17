import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapFile } from '@/main/utils';
import { FileGetQueryInput } from '@/shared/queries/files/file-get';
import { Event } from '@/shared/types/events';
import {
  DownloadStatus,
  FileWithState,
  UploadStatus,
} from '@/shared/types/files';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class FileGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileGetQueryInput>
{
  public async handleQuery(
    input: FileGetQueryInput
  ): Promise<FileWithState | null> {
    return await this.fetchFile(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileGetQueryInput,
    output: FileWithState | null
  ): Promise<ChangeCheckResult<FileGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'file_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.id === input.id
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'file_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.id === input.id
    ) {
      return {
        hasChanges: true,
        result: {
          ...event.file,
          downloadProgress: output?.downloadProgress ?? 0,
          downloadStatus: output?.downloadStatus ?? DownloadStatus.None,
          uploadProgress: output?.uploadProgress ?? 0,
          uploadStatus: output?.uploadStatus ?? UploadStatus.None,
        },
      };
    }

    if (
      event.type === 'file_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.id === input.id
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'file_state_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.fileState.fileId === input.id
    ) {
      if (output === null) {
        const newResult = await this.fetchFile(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }

      return {
        hasChanges: true,
        result: {
          ...output,
          ...event.fileState,
        },
      };
    }

    if (
      event.type === 'file_state_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.fileState.fileId === input.id
    ) {
      if (output === null) {
        const newResult = await this.fetchFile(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }

      return {
        hasChanges: true,
        result: {
          ...output,
          ...event.fileState,
        },
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchFile(
    input: FileGetQueryInput
  ): Promise<FileWithState | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const file = await workspace.database
      .selectFrom('files as f')
      .leftJoin('file_states as fs', 'f.id', 'fs.file_id')
      .select([
        'f.id',
        'f.type',
        'f.parent_id',
        'f.entry_id',
        'f.root_id',
        'f.name',
        'f.original_name',
        'f.mime_type',
        'f.extension',
        'f.size',
        'f.created_at',
        'f.created_by',
        'f.updated_at',
        'f.updated_by',
        'f.deleted_at',
        'f.status',
        'f.version',
        'fs.download_status',
        'fs.download_progress',
        'fs.upload_status',
        'fs.upload_progress',
      ])
      .where('f.id', '=', input.id)
      .where('f.deleted_at', 'is', null)
      .executeTakeFirst();

    if (!file || file.deleted_at) {
      return null;
    }

    const fileWithState: FileWithState = {
      ...mapFile(file),
      downloadProgress: file.download_progress ?? 0,
      downloadStatus: file.download_status ?? DownloadStatus.None,
      uploadProgress: file.upload_progress ?? 0,
      uploadStatus: file.upload_status ?? UploadStatus.None,
    };

    return fileWithState;
  }
}
