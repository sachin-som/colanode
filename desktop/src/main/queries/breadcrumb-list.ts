import { BreadcrumbListQueryInput } from '@/types/queries/breadcrumb-list';
import { databaseContext } from '@/main/data/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { BreadcrumbNode } from '@/types/workspaces';
import { mapNode } from '@/lib/nodes';
import { isEqual } from 'lodash';
import { MutationChange } from '@/types/mutations';

export class BreadcrumbListQueryHandler
  implements QueryHandler<BreadcrumbListQueryInput>
{
  public async handleQuery(
    input: BreadcrumbListQueryInput,
  ): Promise<QueryResult<BreadcrumbListQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildBreadcrumbNodes(input.nodeId, rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: BreadcrumbListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<BreadcrumbListQueryInput>> {
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
        output: this.buildBreadcrumbNodes(input.nodeId, rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: BreadcrumbListQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const query = sql<SelectNode>`
        WITH RECURSIVE breadcrumb_nodes AS (
          SELECT *
          FROM nodes
          WHERE id = ${input.nodeId}
          UNION ALL
          SELECT n.*
          FROM nodes n
          INNER JOIN breadcrumb_nodes b ON n.id = b.parent_id
        )
        SELECT n.*
        FROM breadcrumb_nodes n;
      `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildBreadcrumbNodes = (
    nodeId: string,
    rows: SelectNode[],
  ): BreadcrumbNode[] => {
    const breadcrumbNodes: BreadcrumbNode[] = [];

    let currentId = nodeId;
    while (currentId !== null && currentId !== undefined) {
      const row = rows.find((row) => row.id === currentId);
      if (row) {
        breadcrumbNodes.push(this.buildBreadcrumbNode(row));
        currentId = row.parent_id;
      } else {
        currentId = null;
      }
    }
    return breadcrumbNodes.reverse();
  };

  private buildBreadcrumbNode = (row: SelectNode): BreadcrumbNode => {
    const node = mapNode(row);

    const name = node.attributes.name;
    const avatar = node.attributes.avatar;

    return {
      id: node.id,
      type: node.type,
      name,
      avatar,
    };
  };
}
