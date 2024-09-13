import { useWorkspace } from '@/contexts/workspace';
import { SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { mapNodeWithAttributes } from '@/lib/nodes';
import {
  BoardViewNode,
  CalendarViewNode,
  TableViewNode,
  ViewFilterNode,
  ViewFilterValueNode,
  ViewNode,
} from '@/types/databases';
import { LocalNodeWithAttributes } from '@/types/nodes';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useDatabaseViewsQuery = (databaseId: string) => {
  const workspace = useWorkspace();
  return useQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    ViewNode[],
    string[]
  >({
    queryKey: ['database', databaseId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNodeWithAttributes>`
          view_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${databaseId} AND type IN (${sql.join(ViewNodeTypes)})
          ),
          view_filter_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN 
              (
                SELECT id
                FROM view_nodes
              )
            AND type = ${NodeTypes.ViewFilter}
          ),
          all_nodes AS (
            SELECT * FROM view_nodes
            UNION ALL
            SELECT * FROM view_filter_nodes
          )
          SELECT 
            n.*,
            CASE 
              WHEN COUNT(na.node_id) = 0 THEN json('[]')
              ELSE json_group_array(
                json_object(
                  'node_id', na.'node_id',
                  'type', na.'type',
                  'key', na.'key',
                  'text_value', na.'text_value',
                  'number_value', na.'number_value',
                  'foreign_node_id', na.'foreign_node_id',
                  'created_at', na.'created_at',
                  'updated_at', na.'updated_at',
                  'created_by', na.'created_by',
                  'updated_by', na.'updated_by',
                  'version_id', na.'version_id',
                  'server_created_at', na.'server_created_at',
                  'server_updated_at', na.'server_updated_at',
                  'server_version_id', na.'server_version_id'
                )
              )
            END as attributes
          FROM all_nodes n
          LEFT JOIN node_attributes na ON n.id = na.node_id
          GROUP BY n.id;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNodeWithAttributes>): ViewNode[] => {
      const rows = data?.rows ?? [];
      return buildViewNodes(rows);
    },
  });
};

const buildViewNodes = (rows: SelectNodeWithAttributes[]): ViewNode[] => {
  const nodes = rows.map((row) => mapNodeWithAttributes(row));

  const viewNodes = nodes.filter((node) => ViewNodeTypes.includes(node.type));
  const views: ViewNode[] = [];
  for (const viewNode of viewNodes) {
    const viewFilters = nodes.filter(
      (node) =>
        node.type === NodeTypes.ViewFilter && node.parentId === viewNode.id,
    );
    const view = buildViewNode(viewNode, viewFilters);
    if (view) {
      views.push(view);
    }
  }

  return views;
};

const buildViewNode = (
  node: LocalNodeWithAttributes,
  filters: LocalNodeWithAttributes[],
): ViewNode | null => {
  if (node.type === NodeTypes.TableView) {
    return buildTableViewNode(node, filters);
  } else if (node.type === NodeTypes.BoardView) {
    return buildBoardViewNode(node, filters);
  } else if (node.type === NodeTypes.CalendarView) {
    return buildCalendarViewNode(node, filters);
  }

  return null;
};

const buildTableViewNode = (
  node: LocalNodeWithAttributes,
  filters: LocalNodeWithAttributes[],
): TableViewNode => {
  const name = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Name,
  )?.textValue;

  const hiddenFields = node.attributes
    .filter((attribute) => attribute.type === AttributeTypes.HiddenField)
    .map((attribute) => attribute.foreignNodeId);

  const fieldIndexes = node.attributes
    .filter((attribute) => attribute.type === AttributeTypes.FieldIndex)
    .reduce(
      (acc, attribute) => {
        if (attribute.foreignNodeId && attribute.textValue !== null) {
          acc[attribute.foreignNodeId] = attribute.textValue;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

  const fieldWidths = node.attributes
    .filter((attribute) => attribute.type === AttributeTypes.FieldWidth)
    .reduce(
      (acc, attribute) => {
        if (attribute.foreignNodeId && attribute.numberValue !== null) {
          acc[attribute.foreignNodeId] = attribute.numberValue;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

  const nameWidth = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.NameWidth,
  )?.numberValue;

  const viewFilters = filters.map(buildViewFilterNode);

  return {
    id: node.id,
    name: name ?? 'Unnamed',
    type: 'table_view',
    hiddenFields,
    fieldIndexes,
    fieldWidths,
    nameWidth: nameWidth,
    versionId: node.versionId,
    filters: viewFilters,
  };
};

const buildBoardViewNode = (
  node: LocalNodeWithAttributes,
  filters: LocalNodeWithAttributes[],
): BoardViewNode => {
  const name = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Name,
  )?.textValue;

  const groupBy = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.GroupBy,
  )?.foreignNodeId;

  const viewFilters = filters.map(buildViewFilterNode);

  return {
    id: node.id,
    name: name ?? 'Unnamed',
    type: 'board_view',
    filters: viewFilters,
    groupBy,
  };
};

const buildCalendarViewNode = (
  node: LocalNodeWithAttributes,
  filters: LocalNodeWithAttributes[],
): CalendarViewNode => {
  const name = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Name,
  )?.textValue;

  const viewFilters = filters.map(buildViewFilterNode);

  return {
    id: node.id,
    name: name ?? 'Unnamed',
    type: 'calendar_view',
    filters: viewFilters,
  };
};

const buildViewFilterNode = (node: LocalNodeWithAttributes): ViewFilterNode => {
  const fieldId = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.FieldId,
  )?.foreignNodeId;

  const operator = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Operator,
  )?.textValue;

  const values: ViewFilterValueNode[] = node.attributes
    .filter((attribute) => attribute.type === AttributeTypes.Value)
    .map((attribute) => ({
      textValue: attribute.textValue,
      numberValue: attribute.numberValue,
      foreignNodeId: attribute.foreignNodeId,
    }));

  return {
    id: node.id,
    fieldId,
    operator,
    values,
  };
};
