import { databaseService } from '@/main/data/database-service';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapFile } from '@/main/utils';
import { FileGetQueryInput } from '@/shared/queries/files/file-get';
import { Event } from '@/shared/types/events';
import { FileWithState } from '@/shared/types/files';

export class FileGetQueryHandler implements QueryHandler<FileGetQueryInput> {
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
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'file_created' &&
      event.userId === input.userId &&
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
      event.userId === input.userId &&
      event.file.id === input.id
    ) {
      return {
        hasChanges: true,
        result: {
          ...event.file,
          downloadProgress: output?.downloadProgress ?? 0,
          downloadStatus: output?.downloadStatus ?? 'none',
          uploadProgress: output?.uploadProgress ?? 0,
          uploadStatus: output?.uploadStatus ?? 'none',
        },
      };
    }

    if (
      event.type === 'file_deleted' &&
      event.userId === input.userId &&
      event.file.id === input.id
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchFile(
    input: FileGetQueryInput
  ): Promise<FileWithState | null> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const file = await workspaceDatabase
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
        'f.status',
        'f.version',
        'fs.download_status',
        'fs.download_progress',
        'fs.upload_status',
        'fs.upload_progress',
      ])
      .where('f.id', '=', input.id)
      .executeTakeFirst();

    if (!file) {
      return null;
    }

    const fileWithState: FileWithState = {
      ...mapFile(file),
      downloadProgress: file.download_progress ?? 0,
      downloadStatus: file.download_status ?? 'none',
      uploadProgress: file.upload_progress ?? 0,
      uploadStatus: file.upload_status ?? 'none',
    };

    return fileWithState;
  }
}
