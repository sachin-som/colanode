import { useWorkspace } from '@/contexts/workspace';
import { SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { mapNodeWithAttributes } from '@/lib/nodes';
import {
  DatabaseNode,
  FieldDataType,
  FieldNode,
  SelectOptionNode,
  TableViewNode,
  ViewNode,
} from '@/types/databases';
import { LocalNodeWithAttributes } from '@/types/nodes';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useDatabaseQuery = (databaseId: string) => {
  const workspace = useWorkspace();
  return useQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    DatabaseNode | null,
    string[]
  >({
    queryKey: ['database', databaseId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNodeWithAttributes>`
          WITH database_node AS (
            SELECT *
            FROM nodes
            WHERE id = ${databaseId}
          ),
          field_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${databaseId} AND type = ${NodeTypes.Field}
          ),
          view_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${databaseId} AND type IN (${sql.join(ViewNodeTypes)})
          ),
          select_option_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN 
              (
                SELECT id
                FROM field_nodes
              )
            AND type = ${NodeTypes.SelectOption}
          ),
          all_nodes AS (
            SELECT * FROM database_node
            UNION ALL
            SELECT * FROM field_nodes
            UNION ALL
            SELECT * FROM view_nodes
            UNION ALL
            SELECT * FROM select_option_nodes
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
    select: (
      data: QueryResult<SelectNodeWithAttributes>,
    ): DatabaseNode | null => {
      const rows = data?.rows ?? [];
      return buildDatabaseNode(rows);
    },
  });
};

const buildDatabaseNode = (
  rows: SelectNodeWithAttributes[],
): DatabaseNode | null => {
  const nodes = rows.map((row) => mapNodeWithAttributes(row));

  const databaseLocalNode = nodes.find(
    (node) => node.type === NodeTypes.Database,
  );
  if (!databaseLocalNode) {
    return null;
  }

  const name = databaseLocalNode.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Name,
  )?.textValue;

  const fieldsNodes = nodes.filter((node) => node.type === NodeTypes.Field);
  const groupedSelectOptions = nodes
    .filter((node) => node.type === NodeTypes.SelectOption)
    .reduce(
      (acc, node) => {
        if (!acc[node.parentId]) {
          acc[node.parentId] = [];
        }
        acc[node.parentId].push(node);
        return acc;
      },
      {} as Record<string, LocalNodeWithAttributes[]>,
    );

  const fields: FieldNode[] = [];
  for (const fieldNode of fieldsNodes) {
    const selectOptions = groupedSelectOptions[fieldNode.id] ?? [];
    const field = buildFieldNode(fieldNode, selectOptions);
    if (field) {
      fields.push(field);
    }
  }

  const viewNodes = nodes.filter((node) => ViewNodeTypes.includes(node.type));
  const views: ViewNode[] = [];
  for (const viewNode of viewNodes) {
    const view = buildViewNode(viewNode);
    if (view) {
      views.push(view);
    }
  }

  return {
    id: databaseLocalNode.id,
    name: name,
    fields,
    views,
  };
};

export const buildFieldNode = (
  node: LocalNodeWithAttributes,
  selectOptions: LocalNodeWithAttributes[],
): FieldNode | null => {
  const name = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Name,
  )?.textValue;

  const dataType = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.DataType,
  )?.textValue as FieldDataType;

  if (!dataType) {
    return null;
  }

  switch (dataType) {
    case 'boolean':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'collaborator':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'created_at':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'created_by':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'date':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'email':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'file':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'multi_select':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
        options: selectOptions.map(buildSelectOption),
      };
    case 'number':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'phone':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'select':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
        options: selectOptions.map(buildSelectOption),
      };
    case 'text':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    case 'url':
      return {
        id: node.id,
        name,
        dataType,
        index: node.index,
      };
    default:
      return null;
  }
};

export const buildSelectOption = (
  node: LocalNodeWithAttributes,
): SelectOptionNode => {
  const name = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Name,
  )?.textValue;

  const color = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Color,
  )?.textValue;

  return {
    id: node.id,
    name: name ?? 'Unnamed',
    color: color ?? 'gray',
  };
};

export const buildViewNode = (
  node: LocalNodeWithAttributes,
): ViewNode | null => {
  if (node.type === NodeTypes.TableView) {
    return buildTableViewNode(node);
  }

  return null;
};

export const buildTableViewNode = (
  node: LocalNodeWithAttributes,
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

  return {
    id: node.id,
    name: name ?? 'Unnamed',
    type: 'table_view',
    hiddenFields,
    fieldIndexes,
    fieldWidths,
    nameWidth: nameWidth,
    versionId: node.versionId,
  };
};
