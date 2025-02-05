import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapFile } from '@/main/lib/mappers';
import { FileListQueryInput } from '@/shared/queries/files/file-list';
import { Event } from '@/shared/types/events';
import { File } from '@/shared/types/files';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class FileListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileListQueryInput>
{
  public async handleQuery(input: FileListQueryInput): Promise<File[]> {
    return await this.fetchFiles(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileListQueryInput,
    output: File[]
  ): Promise<ChangeCheckResult<FileListQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'file_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.parentId === input.parentId
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
      event.file.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.file.id);
      if (file) {
        const newResult = output.map((file) => {
          if (file.id === event.file.id) {
            return event.file;
          }

          return file;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'file_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.file.id);
      if (file) {
        const output = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: output,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchFiles(input: FileListQueryInput): Promise<File[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const files = await workspace.database
      .selectFrom('files')
      .selectAll()
      .where('parent_id', '=', input.parentId)
      .where('deleted_at', 'is', null)
      .orderBy('id', 'asc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return files.map(mapFile);
  }
}
