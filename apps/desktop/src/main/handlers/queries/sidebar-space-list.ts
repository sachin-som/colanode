import { SidebarSpaceListQueryInput } from '@/operations/queries/sidebar-space-list';
import { databaseManager } from '@/main/data/database-manager';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@colanode/core';
import { SidebarNode, SidebarSpaceNode } from '@/types/workspaces';
import { mapNode } from '@/main/utils';
import { Node } from '@colanode/core';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';
import { compareString } from '@/lib/utils';

interface UnreadCountRow {
  node_id: string;
  unread_count: number;
  mentions_count: number;
}

export class SidebarSpaceListQueryHandler
  implements QueryHandler<SidebarSpaceListQueryInput>
{
  public async handleQuery(
    input: SidebarSpaceListQueryInput
  ): Promise<QueryResult<SidebarSpaceListQueryInput>> {
    const rows = await this.fetchNodes(input);
    const unreadCounts = await this.fetchUnreadCounts(input, rows);

    return {
      output: this.buildSidebarSpaceNodes(rows, unreadCounts),
      state: {
        rows,
        unreadCounts,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: SidebarSpaceListQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<SidebarSpaceListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          (change.table === 'nodes' || change.table === 'user_nodes') &&
          change.userId === input.userId
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchNodes(input);
    const unreadCounts = await this.fetchUnreadCounts(input, rows);
    if (
      isEqual(rows, state.rows) &&
      isEqual(unreadCounts, state.unreadCounts)
    ) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildSidebarSpaceNodes(rows, unreadCounts),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: SidebarSpaceListQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
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

  private async fetchUnreadCounts(
    input: SidebarSpaceListQueryInput,
    rows: SelectNode[]
  ): Promise<UnreadCountRow[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const channelIds = rows
      .filter((r) => r.type === NodeTypes.Channel)
      .map((r) => r.id);

    const unreadCounts = await workspaceDatabase
      .selectFrom('user_nodes as un')
      .innerJoin('nodes as n', 'un.node_id', 'n.id')
      .where('un.user_id', '=', input.userId)
      .where('n.type', '=', NodeTypes.Message)
      .where('n.parent_id', 'in', channelIds)
      .where('un.last_seen_version_id', 'is', null)
      .select(['un.node_id'])
      .select((eb) => [
        eb.fn.count<number>('un.node_id').as('unread_count'),
        eb.fn.sum<number>('un.mentions_count').as('mentions_count'),
      ])
      .groupBy('n.parent_id')
      .execute();

    return unreadCounts;
  }

  private buildSidebarSpaceNodes = (
    rows: SelectNode[],
    unreadCounts: UnreadCountRow[]
  ): SidebarSpaceNode[] => {
    const nodes: Node[] = rows.map(mapNode);
    const spaces: SidebarSpaceNode[] = [];

    for (const node of nodes) {
      if (node.type !== NodeTypes.Space) {
        continue;
      }

      const children = nodes
        .filter((n) => n.parentId === node.id)
        .sort((a, b) => compareString(a.index, b.index));

      const spaceNode = this.buildSpaceNode(node, children, unreadCounts);
      if (spaceNode) {
        spaces.push(spaceNode);
      }
    }

    return spaces;
  };

  private buildSpaceNode = (
    node: Node,
    children: Node[],
    unreadCounts: UnreadCountRow[]
  ): SidebarSpaceNode | null => {
    if (node.type !== 'space') {
      return null;
    }

    const childrenNodes: SidebarNode[] = [];
    for (const child of children) {
      const childNode = this.buildSidearNode(child, unreadCounts);
      if (childNode) {
        childrenNodes.push(childNode);
      }
    }

    return {
      id: node.id,
      type: node.type,
      name: node.attributes.name ?? null,
      avatar: node.attributes.avatar ?? null,
      children: childrenNodes,
      unreadCount: 0,
      mentionsCount: 0,
    };
  };

  private buildSidearNode = (
    node: Node,
    unreadCounts: UnreadCountRow[]
  ): SidebarNode | null => {
    const unreadCountRow = unreadCounts.find((r) => r.node_id === node.id);

    if (
      node.type !== 'channel' &&
      node.type !== 'page' &&
      node.type !== 'folder' &&
      node.type !== 'database'
    ) {
      return null;
    }

    return {
      id: node.id,
      type: node.type,
      name: node.attributes.name ?? null,
      avatar: node.attributes.avatar ?? null,
      unreadCount: unreadCountRow?.unread_count ?? 0,
      mentionsCount: unreadCountRow?.mentions_count ?? 0,
    };
  };
}
