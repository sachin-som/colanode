import { databaseManager } from '@/main/data/database-manager';
import { mapNode } from '@/main/utils';
import { SelectNode } from '@/main/data/workspace/schema';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';
import { NodeWithAncestorsGetQueryInput } from '@/operations/queries/node-with-ancestors-get';
import { fetchNodeAncestors } from '@/main/utils';

export class NodeWithAncestorsGetQueryHandler
  implements QueryHandler<NodeWithAncestorsGetQueryInput>
{
  public async handleQuery(
    input: NodeWithAncestorsGetQueryInput
  ): Promise<QueryResult<NodeWithAncestorsGetQueryInput>> {
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
    input: NodeWithAncestorsGetQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<NodeWithAncestorsGetQueryInput>> {
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
    input: NodeWithAncestorsGetQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
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
      result.push(node);
      node = rows.find((row) => row.id === node?.parent_id);

      if (!node || node.id === node.parent_id) {
        break;
      }
    }

    return result.reverse();
  }
}
