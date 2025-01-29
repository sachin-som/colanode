import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { fetchEntryBreadcrumb } from '@/main/lib/utils';
import { EntryBreadcrumbGetQueryInput } from '@/shared/queries/entries/entry-breadcrumb-get';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class EntryBreadcrumbGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<EntryBreadcrumbGetQueryInput>
{
  public async handleQuery(
    input: EntryBreadcrumbGetQueryInput
  ): Promise<string[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    return fetchEntryBreadcrumb(workspace.database, input.entryId);
  }

  public async checkForChanges(
    event: Event,
    input: EntryBreadcrumbGetQueryInput,
    output: string[]
  ): Promise<ChangeCheckResult<EntryBreadcrumbGetQueryInput>> {
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
      event.type === 'entry_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.id === input.entryId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'entry_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const entryId = output.find((id) => id === event.entry.id);
      if (entryId) {
        const newResult = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    return {
      hasChanges: false,
      result: output,
    };
  }
}
