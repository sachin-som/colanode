import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import {
  DatabaseNode,
  FieldDataType,
  FieldNode,
  SelectOptionNode,
} from '@/types/databases';
import { LocalNode } from '@/types/nodes';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useDatabaseQuery = (databaseId: string) => {
  const workspace = useWorkspace();
  return useQuery<
    QueryResult<SelectNode>,
    Error,
    DatabaseNode | null,
    string[]
  >({
    queryKey: ['database', databaseId],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
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
          select_option_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN 
              (
                SELECT id
                FROM field_nodes
              )
            AND type = ${NodeTypes.SelectOption}
          )
          SELECT * FROM database_node
          UNION ALL
          SELECT * FROM field_nodes
          UNION ALL
          SELECT * FROM select_option_nodes
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNode>): DatabaseNode | null => {
      const rows = data?.rows ?? [];
      return buildDatabaseNode(rows);
    },
  });
};

const buildDatabaseNode = (rows: SelectNode[]): DatabaseNode | null => {
  const nodes = rows.map((row) => mapNode(row));

  const databaseLocalNode = nodes.find(
    (node) => node.type === NodeTypes.Database,
  );
  if (!databaseLocalNode) {
    return null;
  }

  const name = databaseLocalNode.attributes.name;
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
      {} as Record<string, LocalNode[]>,
    );

  const fields: FieldNode[] = [];
  for (const fieldNode of fieldsNodes) {
    const selectOptions = groupedSelectOptions[fieldNode.id] ?? [];
    const field = buildFieldNode(fieldNode, selectOptions);
    if (field) {
      fields.push(field);
    }
  }

  return {
    id: databaseLocalNode.id,
    name: name,
    fields,
  };
};

const buildFieldNode = (
  node: LocalNode,
  selectOptions: LocalNode[],
): FieldNode | null => {
  const name = node.attributes.name;
  const dataType = node.attributes.dataType as FieldDataType;

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

const buildSelectOption = (node: LocalNode): SelectOptionNode => {
  const name = node.attributes.name;
  const color = node.attributes.color;

  return {
    id: node.id,
    name: name ?? 'Unnamed',
    color: color ?? 'gray',
  };
};
