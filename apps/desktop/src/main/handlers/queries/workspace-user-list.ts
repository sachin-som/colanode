import { WorkspaceUserListQueryInput } from '@/operations/queries/workspace-user-list';
import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@colanode/core';
import { mapNode } from '@/main/utils';
import { SelectNode } from '@/main/data/workspace/schema';
import { UserNode } from '@colanode/core';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';

export class WorkspaceUserListQueryHandler
  implements QueryHandler<WorkspaceUserListQueryInput>
{
  public async handleQuery(
    input: WorkspaceUserListQueryInput
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
    state: Record<string, any>
  ): Promise<ChangeCheckResult<WorkspaceUserListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId
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
    input: WorkspaceUserListQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

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

  private buildWorkspaceUserNodes = (rows: SelectNode[]): UserNode[] => {
    const nodes = rows.map(mapNode);
    const users: UserNode[] = [];

    for (const node of nodes) {
      if (node.type === NodeTypes.User) {
        users.push(node as UserNode);
      }
    }

    return users;
  };
}
