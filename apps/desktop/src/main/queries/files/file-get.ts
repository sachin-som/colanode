import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapFile } from '@/main/lib/mappers';
import { FileGetQueryInput } from '@/shared/queries/files/file-get';
import { Event } from '@/shared/types/events';
import { File } from '@/shared/types/files';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class FileGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileGetQueryInput>
{
  public async handleQuery(input: FileGetQueryInput): Promise<File | null> {
    return await this.fetchFile(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileGetQueryInput,
    _: File | null
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
        result: event.file,
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

    return {
      hasChanges: false,
    };
  }

  private async fetchFile(input: FileGetQueryInput): Promise<File | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const file = await workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!file || file.deleted_at) {
      return null;
    }

    return mapFile(file);
  }
}
