import { SelectWorkspace } from '@/main/databases/account';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapWorkspace } from '@/main/lib/mappers';
import { WorkspaceGetQueryInput } from '@/shared/queries/workspaces/workspace-get';
import { Event } from '@/shared/types/events';
import { Workspace } from '@/shared/types/workspaces';
import { appService } from '@/main/services/app-service';

export class WorkspaceGetQueryHandler
  implements QueryHandler<WorkspaceGetQueryInput>
{
  public async handleQuery(
    input: WorkspaceGetQueryInput
  ): Promise<Workspace | null> {
    const row = await this.fetchWorkspace(input.accountId, input.workspaceId);
    if (!row) {
      return null;
    }

    return mapWorkspace(row);
  }

  public async checkForChanges(
    event: Event,
    input: WorkspaceGetQueryInput,
    _: Workspace | null
  ): Promise<ChangeCheckResult<WorkspaceGetQueryInput>> {
    if (
      event.type === 'workspace_created' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: event.workspace,
      };
    }

    if (
      event.type === 'workspace_updated' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: event.workspace,
      };
    }

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

    return {
      hasChanges: false,
    };
  }

  private async fetchWorkspace(
    accountId: string,
    workspaceId: string
  ): Promise<SelectWorkspace | undefined> {
    const account = appService.getAccount(accountId);
    if (!account) {
      return undefined;
    }

    const workspace = await account.database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    return workspace;
  }
}
