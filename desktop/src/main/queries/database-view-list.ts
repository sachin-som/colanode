import { DatabaseViewListQueryInput } from '@/types/queries/database-view-list';
import { databaseContext } from '@/main/data/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { SelectNode } from '@/main/data/workspace/schema';
import { mapNode } from '@/lib/nodes';
import { NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { LocalNode } from '@/types/nodes';
import {
  BoardViewNode,
  CalendarViewNode,
  TableViewNode,
  ViewNode,
} from '@/types/databases';
import { isEqual } from 'lodash';
import { MutationChange } from '@/types/mutations';

export class DatabaseViewListQueryHandler
  implements QueryHandler<DatabaseViewListQueryInput>
{
  public async handleQuery(
    input: DatabaseViewListQueryInput,
  ): Promise<QueryResult<DatabaseViewListQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildViewNodes(rows),
      state: {
        rows: rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: DatabaseViewListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<DatabaseViewListQueryInput>> {
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
        output: this.buildViewNodes(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: DatabaseViewListQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    const rows = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.databaseId),
          eb('type', 'in', ViewNodeTypes),
        ]),
      )
      .execute();
    return rows;
  }

  private buildViewNodes = (rows: SelectNode[]): ViewNode[] => {
    const nodes = rows.map((row) => mapNode(row));
    const views: ViewNode[] = [];
    for (const node of nodes) {
      const view = this.buildViewNode(node);
      if (view) {
        views.push(view);
      }
    }

    return views;
  };

  private buildViewNode = (node: LocalNode): ViewNode | null => {
    if (node.type === NodeTypes.TableView) {
      return this.buildTableViewNode(node);
    } else if (node.type === NodeTypes.BoardView) {
      return this.buildBoardViewNode(node);
    } else if (node.type === NodeTypes.CalendarView) {
      return this.buildCalendarViewNode(node);
    }

    return null;
  };

  private buildTableViewNode = (node: LocalNode): TableViewNode => {
    const name = node.attributes.name;
    const hiddenFields = node.attributes.hiddenFields;
    const fieldIndexes = node.attributes.fieldIndexes;
    const fieldWidths = node.attributes.fieldWidths;
    const nameWidth = node.attributes.nameWidth;

    const viewFilters = node.attributes.filters;
    const viewSorts = node.attributes.sorts;

    return {
      id: node.id,
      name: name ?? 'Unnamed',
      type: 'table_view',
      hiddenFields,
      fieldIndexes,
      fieldWidths,
      nameWidth: nameWidth,
      versionId: node.versionId,
      filters: viewFilters ?? [],
      sorts: viewSorts ?? [],
    };
  };

  private buildBoardViewNode = (node: LocalNode): BoardViewNode => {
    const name = node.attributes.name;
    const groupBy = node.attributes.groupBy;
    const viewFilters = node.attributes.filters;
    const viewSorts = node.attributes.sorts;

    return {
      id: node.id,
      name: name ?? 'Unnamed',
      type: 'board_view',
      filters: viewFilters ?? [],
      sorts: viewSorts ?? [],
      groupBy,
    };
  };

  private buildCalendarViewNode = (node: LocalNode): CalendarViewNode => {
    const name = node.attributes.name;
    const groupBy = node.attributes.groupBy;

    const viewFilters = node.attributes.filters;
    const viewSorts = node.attributes.sorts;

    return {
      id: node.id,
      name: name ?? 'Unnamed',
      type: 'calendar_view',
      filters: viewFilters ?? [],
      sorts: viewSorts ?? [],
      groupBy,
    };
  };
}
