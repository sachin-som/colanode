import { NodeGetQueryInput } from '@/operations/queries/node-get';
import { databaseManager } from '@/main/data/database-manager';
import { mapNode } from '@/main/utils';
import { SelectNode } from '@/main/data/workspace/schema';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash';

export class NodeGetQueryHandler implements QueryHandler<NodeGetQueryInput> {
  public async handleQuery(
    input: NodeGetQueryInput
  ): Promise<QueryResult<NodeGetQueryInput>> {
    const row = await this.fetchNode(input);

    return {
      output: row ? mapNode(row) : null,
      state: {
        row,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: NodeGetQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<NodeGetQueryInput>> {
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

    const row = await this.fetchNode(input);
    if (isEqual(row, state.row)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: row ? mapNode(row) : null,
        state: {
          row,
        },
      },
    };
  }

  private async fetchNode(
    input: NodeGetQueryInput
  ): Promise<SelectNode | undefined> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const row = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.nodeId)
      .executeTakeFirst();

    return row;
  }
}
