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
import { NodeTreeGetQueryInput } from '@/operations/queries/node-tree-get';
import { fetchNodeAncestors } from '@/main/utils';

export class NodeTreeGetQueryHandler
  implements QueryHandler<NodeTreeGetQueryInput>
{
  public async handleQuery(
    input: NodeTreeGetQueryInput
  ): Promise<QueryResult<NodeTreeGetQueryInput>> {
    const rows = await this.fetchNodes(input);

    return {
      output: rows.map(mapNode),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: NodeTreeGetQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<NodeTreeGetQueryInput>> {
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
        output: rows.map(mapNode),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: NodeTreeGetQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await fetchNodeAncestors(workspaceDatabase, input.nodeId);
    if (rows.length === 0) {
      return [];
    }

    const result: SelectNode[] = [];

    let node = rows.find((row) => row.id === input.nodeId);
    if (!node) {
      return [];
    }

    while (node) {
      result.unshift(node);
      node = rows.find((row) => row.id === node?.parent_id);

      if (!node || node.id === node.parent_id) {
        break;
      }
    }

    return result;
  }
}
