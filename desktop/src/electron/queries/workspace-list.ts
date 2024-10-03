import { WorkspaceListQueryInput } from '@/types/queries/workspace-list';
import { databaseContext } from '@/electron/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { Workspace, WorkspaceRole } from '@/types/workspaces';
import { SelectWorkspace } from '../schemas/app';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class WorkspaceListQueryHandler
  implements QueryHandler<WorkspaceListQueryInput>
{
  public async handleQuery(
    input: WorkspaceListQueryInput,
  ): Promise<QueryResult<WorkspaceListQueryInput>> {
    const rows = await this.fetchWorkspaces();

    return {
      output: this.buildWorkspaces(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: WorkspaceListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<WorkspaceListQueryInput>> {
    if (
      !changes.some(
        (change) => change.type === 'app' && change.table === 'accounts',
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchWorkspaces();
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildWorkspaces(rows),
        state: {
          rows,
        },
      },
    };
  }

  private fetchWorkspaces(): Promise<SelectWorkspace[]> {
    return databaseContext.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where(
        'account_id',
        'in',
        databaseContext.appDatabase
          .selectFrom('accounts')
          .where('status', '=', 'active')
          .select('id'),
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
        synced: row.synced === 1,
      };
    });
  }
}
