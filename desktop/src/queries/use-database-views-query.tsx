import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import {
  BoardViewNode,
  CalendarViewNode,
  TableViewNode,
  ViewNode,
} from '@/types/databases';
import { LocalNode } from '@/types/nodes';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useDatabaseViewsQuery = (databaseId: string) => {
  const workspace = useWorkspace();
  return useQuery<QueryResult<SelectNode>, Error, ViewNode[], string[]>({
    queryKey: ['database-views', databaseId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        SELECT *
        FROM nodes
        WHERE parent_id = ${databaseId} AND type IN (${sql.join(ViewNodeTypes)})
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNode>): ViewNode[] => {
      const rows = data?.rows ?? [];
      return buildViewNodes(rows);
    },
  });
};

const buildViewNodes = (rows: SelectNode[]): ViewNode[] => {
  const nodes = rows.map((row) => mapNode(row));
  const views: ViewNode[] = [];
  for (const node of nodes) {
    const view = buildViewNode(node);
    if (view) {
      views.push(view);
    }
  }

  return views;
};

const buildViewNode = (node: LocalNode): ViewNode | null => {
  if (node.type === NodeTypes.TableView) {
    return buildTableViewNode(node);
  } else if (node.type === NodeTypes.BoardView) {
    return buildBoardViewNode(node);
  } else if (node.type === NodeTypes.CalendarView) {
    return buildCalendarViewNode(node);
  }

  return null;
};

const buildTableViewNode = (node: LocalNode): TableViewNode => {
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

const buildBoardViewNode = (node: LocalNode): BoardViewNode => {
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

const buildCalendarViewNode = (node: LocalNode): CalendarViewNode => {
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
