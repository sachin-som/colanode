import { WorkspaceListQueryInput } from '@/shared/queries/workspace-list';
import { databaseService } from '@/main/data/database-service';
import { Workspace } from '@/shared/types/workspaces';
import { WorkspaceRole } from '@colanode/core';
import { SelectWorkspace } from '@/main/data/app/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { Event } from '@/shared/types/events';

export class WorkspaceListQueryHandler
  implements QueryHandler<WorkspaceListQueryInput>
{
  public async handleQuery(_: WorkspaceListQueryInput): Promise<Workspace[]> {
    const rows = await this.fetchWorkspaces();
    return this.buildWorkspaces(rows);
  }

  public async checkForChanges(
    event: Event,
    _: WorkspaceListQueryInput,
    output: Workspace[]
  ): Promise<ChangeCheckResult<WorkspaceListQueryInput>> {
    if (event.type === 'workspace_created') {
      const newWorkspaces = [...output, event.workspace];
      return {
        hasChanges: true,
        result: newWorkspaces,
      };
    }

    if (event.type === 'workspace_updated') {
      const updatedWorkspaces = output.map((workspace) => {
        if (workspace.id === event.workspace.id) {
          return event.workspace;
        }
        return workspace;
      });

      return {
        hasChanges: true,
        result: updatedWorkspaces,
      };
    }

    if (event.type === 'workspace_deleted') {
      const activeWorkspaces = output.filter(
        (workspace) => workspace.id !== event.workspace.id
      );

      return {
        hasChanges: true,
        result: activeWorkspaces,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchWorkspaces(): Promise<SelectWorkspace[]> {
    return databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where(
        'account_id',
        'in',
        databaseService.appDatabase
          .selectFrom('accounts')
          .where('status', '=', 'active')
          .select('id')
      )
      .execute();
  }

  private buildWorkspaces(rows: SelectWorkspace[]): Workspace[] {
    return rows.map((row) => {
      return {
        id: row.workspace_id,
        name: row.name,
        description: row.description,
        avatar: row.avatar,
        versionId: row.version_id,
        accountId: row.account_id,
        role: row.role as WorkspaceRole,
        userId: row.user_id,
      };
    });
  }
}
