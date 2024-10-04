import { SidebarSpaceListQueryInput } from '@/types/queries/sidebar-space-list';
import { databaseManager } from '@/main/data/database-manager';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@/lib/constants';
import { SidebarNode, SidebarSpaceNode } from '@/types/workspaces';
import { mapNode } from '@/lib/nodes';
import { LocalNode } from '@/types/nodes';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class SidebarSpaceListQueryHandler
  implements QueryHandler<SidebarSpaceListQueryInput>
{
  public async handleQuery(
    input: SidebarSpaceListQueryInput,
  ): Promise<QueryResult<SidebarSpaceListQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildSidebarSpaceNodes(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: SidebarSpaceListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<SidebarSpaceListQueryInput>> {
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
        output: this.buildSidebarSpaceNodes(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: SidebarSpaceListQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<SelectNode>`
        WITH space_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id IS NULL AND type = ${NodeTypes.Space}
        ),
        space_children_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id IN (SELECT id FROM space_nodes)
        )
        SELECT * FROM space_nodes
        UNION ALL
        SELECT * FROM space_children_nodes;
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildSidebarSpaceNodes = (rows: SelectNode[]): SidebarSpaceNode[] => {
    const nodes: LocalNode[] = rows.map(mapNode);
    const spaces: SidebarSpaceNode[] = [];

    for (const node of nodes) {
      if (node.type !== NodeTypes.Space) {
        continue;
      }

      const children = nodes.filter((n) => n.parentId === node.id);
      spaces.push(this.buildSpaceNode(node, children));
    }

    return spaces;
  };

  private buildSpaceNode = (
    node: LocalNode,
    children: LocalNode[],
  ): SidebarSpaceNode => {
    return {
      id: node.id,
      type: node.type,
      name: node.attributes?.name ?? null,
      avatar: node.attributes?.avatar ?? null,
      children: children.map(this.buildSidearNode),
    };
  };

  private buildSidearNode = (node: LocalNode): SidebarNode => {
    return {
      id: node.id,
      type: node.type,
      name: node.attributes.name ?? null,
      avatar: node.attributes.avatar ?? null,
    };
  };
}
