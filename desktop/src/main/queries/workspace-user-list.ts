import { WorkspaceUserListQueryInput } from '@/types/queries/workspace-user-list';
import { databaseContext } from '@/main/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { SelectNode } from '../schemas/workspace';
import { LocalNode } from '@/types/nodes';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class WorkspaceUserListQueryHandler
  implements QueryHandler<WorkspaceUserListQueryInput>
{
  public async handleQuery(
    input: WorkspaceUserListQueryInput,
  ): Promise<QueryResult<WorkspaceUserListQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildWorkspaceUserNodes(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: WorkspaceUserListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<WorkspaceUserListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchNodes(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildWorkspaceUserNodes(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: WorkspaceUserListQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const offset = input.page * input.count;
    const rows = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('type', '=', NodeTypes.User)
      .orderBy('created_at asc')
      .offset(offset)
      .limit(input.count)
      .execute();

    return rows;
  }

  private buildWorkspaceUserNodes = (rows: SelectNode[]): LocalNode[] => {
    return rows.map(mapNode);
  };
}
