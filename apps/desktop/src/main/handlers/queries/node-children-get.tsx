import { NodeChildrenGetQueryInput } from '@/operations/queries/node-children-get';
import { databaseService } from '@/main/data/database-service';
import { mapNode } from '@/main/utils';
import { SelectNode } from '@/main/data/workspace/schema';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';

export class NodeChildrenGetQueryHandler
  implements QueryHandler<NodeChildrenGetQueryInput>
{
  public async handleQuery(
    input: NodeChildrenGetQueryInput
  ): Promise<QueryResult<NodeChildrenGetQueryInput>> {
    const rows = await this.fetchChildren(input);

    return {
      output: rows.map(mapNode),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: NodeChildrenGetQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<NodeChildrenGetQueryInput>> {
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

    const rows = await this.fetchChildren(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: rows.map(mapNode),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchChildren(
    input: NodeChildrenGetQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', '=', input.nodeId)
      .where('type', 'in', input.types ?? [])
      .execute();

    return rows;
  }
}
