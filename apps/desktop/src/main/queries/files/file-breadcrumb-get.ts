import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { FileBreadcrumbGetQueryInput } from '@/shared/queries/files/file-breadcrumb-get';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { fetchFileBreadcrumb } from '@/main/lib/utils';

export class FileBreadcrumbGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileBreadcrumbGetQueryInput>
{
  public async handleQuery(
    input: FileBreadcrumbGetQueryInput
  ): Promise<string[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    return fetchFileBreadcrumb(workspace.database, input.fileId);
  }

  public async checkForChanges(
    event: Event,
    input: FileBreadcrumbGetQueryInput,
    output: string[]
  ): Promise<ChangeCheckResult<FileBreadcrumbGetQueryInput>> {
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
      event.file.id === input.fileId
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'file_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.id === input.fileId
    ) {
      const fileId = output.find((id) => id === event.file.id);
      if (fileId) {
        const newOutput = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }
}
