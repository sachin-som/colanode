import { useDatabase } from '@/contexts/database';
import { useWorkspace } from '@/contexts/workspace';
import { SelectNode, SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { mapNodeWithAttributes } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import {
  BooleanFieldNode,
  CreatedAtFieldNode,
  DateFieldNode,
  EmailFieldNode,
  FieldNode,
  MultiSelectFieldNode,
  NumberFieldNode,
  PhoneFieldNode,
  RecordNode,
  SelectFieldNode,
  TextFieldNode,
  UrlFieldNode,
  ViewFilterNode,
  ViewSortNode,
} from '@/types/databases';
import { User } from '@/types/users';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { sha256 } from 'js-sha256';
import { QueryResult, sql } from 'kysely';

const RECORDS_PER_PAGE = 50;

export const useRecordsQuery = (
  databaseId: string,
  filters: ViewFilterNode[],
  sorts: ViewSortNode[],
) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  let hash = '';
  if (filters.length > 0 || sorts.length > 0) {
    const json = JSON.stringify({ filters, sorts });
    hash = sha256(json);
  }

  return useInfiniteQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    RecordNode[],
    string[],
    number
  >({
    queryKey: ['records', databaseId, hash],
    initialPageParam: 0,
    getNextPageParam: (lastPage: QueryResult<SelectNode>, pages) => {
      if (lastPage && lastPage.rows) {
        const recordsCount = lastPage.rows.filter(
          (row) => row.type === NodeTypes.Record,
        ).length;

        if (recordsCount >= RECORDS_PER_PAGE) {
          return pages.length;
        }
      }
      return undefined;
    },
    queryFn: async ({ queryKey, pageParam }) => {
      const offset = pageParam * RECORDS_PER_PAGE;

      const filterQuery = buildFiltersQuery(filters, database.fields);
      const joinsQuery = buildSortJoinsQuery(sorts, database.fields);
      const orderByQuery = `ORDER BY ${sorts.length > 0 ? buildSortOrdersQuery(sorts, database.fields) : 'n."index" ASC'}`;

      const query = sql<SelectNodeWithAttributes>`
        WITH record_nodes AS (
          SELECT n.*, ROW_NUMBER() OVER (${sql.raw(orderByQuery)}) AS order_number
          FROM nodes n
          ${sql.raw(joinsQuery)}
          WHERE n.parent_id = ${databaseId} AND n.type = ${NodeTypes.Record} ${sql.raw(filterQuery)}
          ${sql.raw(orderByQuery)}
          LIMIT ${sql.lit(RECORDS_PER_PAGE)}
          OFFSET ${sql.lit(offset)}
        ),
        author_nodes AS (
          SELECT *, NULL AS order_number
          FROM nodes
          WHERE id IN (SELECT DISTINCT created_by FROM record_nodes)
        ),
        all_nodes as (
          SELECT * FROM record_nodes
          UNION ALL
          SELECT * FROM author_nodes
        )
        SELECT 
            n.*,
            json_group_array(
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
                'updated_by', na.updated_by,
                'version_id', na.'version_id',
                'server_created_at', na.'server_created_at',
                'server_updated_at', na.'server_updated_at',
                'server_version_id', na.'server_version_id'
              )
            ) as attributes
          FROM all_nodes n
          LEFT JOIN node_attributes na ON n.id = na.node_id
          GROUP BY n.id
          ORDER BY n.order_number ASC
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        page: pageParam,
        query,
      });
    },
    select: (
      data: InfiniteData<QueryResult<SelectNodeWithAttributes>>,
    ): RecordNode[] => {
      const pages = data?.pages ?? [];
      const rows = pages.map((page) => page.rows).flat();
      return buildRecords(rows);
    },
  });
};

const buildRecords = (rows: SelectNodeWithAttributes[]): RecordNode[] => {
  const nodes = rows.map(mapNodeWithAttributes);
  const recordNodes = nodes.filter((node) => node.type === NodeTypes.Record);

  const authorNodes = nodes.filter((node) => node.type === NodeTypes.User);
  const records: RecordNode[] = [];
  const authorMap = new Map<string, User>();

  for (const author of authorNodes) {
    const name = author.attributes.find(
      (attr) => attr.type === AttributeTypes.Name,
    )?.textValue;

    const avatar = author.attributes.find(
      (attr) => attr.type === AttributeTypes.Avatar,
    )?.textValue;

    authorMap.set(author.id, {
      id: author.id,
      name: name ?? 'Unknown User',
      avatar,
    });
  }

  for (const node of recordNodes) {
    const name = node.attributes.find(
      (attr) => attr.type === AttributeTypes.Name,
    )?.textValue;

    const author = authorMap.get(node.createdBy);
    const record: RecordNode = {
      id: node.id,
      parentId: node.parentId,
      name: name ?? null,
      index: node.index,
      attributes: node.attributes,
      createdAt: new Date(node.createdAt),
      createdBy: author ?? {
        id: node.createdBy,
        name: 'Unknown User',
        avatar: null,
      },
      versionId: node.versionId,
    };

    records.push(record);
  }

  return records;
};

const buildFiltersQuery = (
  filters: ViewFilterNode[],
  fields: FieldNode[],
): string => {
  if (filters.length === 0) {
    return '';
  }

  const filterQueries = filters
    .map((filter) => buildFilterQuery(filter, fields))
    .filter((query) => query !== null);

  if (filterQueries.length === 0) {
    return '';
  }

  const joinQueries = filterQueries
    .map((query) => query.joinQuery)
    .filter((query) => query !== null && query.length > 0);

  const whereQueries = filterQueries
    .map((query) => query.whereQuery)
    .filter((query) => query !== null && query.length > 0);

  return `AND n.id IN
    ( 
      SELECT na.node_id
      FROM node_attributes na
      ${joinQueries.join(' ')}
      ${whereQueries.length > 0 ? `WHERE ${whereQueries.join(' AND ')}` : ''}
    )
  `;
};

interface FilterQuery {
  joinQuery: string;
  whereQuery: string | null;
}

const buildFilterQuery = (
  filter: ViewFilterNode,
  fields: FieldNode[],
): FilterQuery | null => {
  const field = fields.find((field) => field.id === filter.fieldId);
  if (!field) {
    return null;
  }

  switch (field.dataType) {
    case 'boolean':
      return buildBooleanFilterQuery(filter, field);
    case 'collaborator':
      return null;
    case 'created_at':
      return buildCreatedAtFilterQuery(filter, field);
    case 'created_by':
      return null;
    case 'date':
      return buildDateFilterQuery(filter, field);
    case 'email':
      return buildEmailFilterQuery(filter, field);
    case 'file':
      return null;
    case 'multi_select':
      return buildMultiSelectFilterQuery(filter, field);
    case 'number':
      return buildNumberFilterQuery(filter, field);
    case 'phone':
      return buildPhoneFilterQuery(filter, field);
    case 'select':
      return buildSelectFilterQuery(filter, field);
    case 'text':
      return buildTextFilterQuery(filter, field);
    case 'url':
      return buildUrlFilterQuery(filter, field);
    default:
      return null;
  }
};

const buildBooleanFilterQuery = (
  filter: ViewFilterNode,
  field: BooleanFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_true') {
    return {
      joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.number_value = 1`,
      whereQuery: null,
    };
  }

  if (filter.operator === 'is_false') {
    return {
      joinQuery: buildFilterLeftJoinNodeAttributesQuery(filter.id, field.id),
      whereQuery: `na_${filter.id}.node_id IS NULL OR na_${filter.id}.number_value = 0`,
    };
  }

  return null;
};

const buildNumberFilterQuery = (
  filter: ViewFilterNode,
  field: NumberFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const value = filter.values[0].numberValue;
  if (value === null) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.number_value = ${value}`,
        whereQuery: null,
      };
    case 'is_not_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.number_value != ${value}`,
        whereQuery: null,
      };
    case 'is_greater_than':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.number_value > ${value}`,
        whereQuery: null,
      };
    case 'is_less_than':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.number_value < ${value}`,
        whereQuery: null,
      };
    case 'is_greater_than_or_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.number_value >= ${value}`,
        whereQuery: null,
      };
    case 'is_less_than_or_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.number_value <= ${value}`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildTextFilterQuery = (
  filter: ViewFilterNode,
  field: TextFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const value = filter.values[0].textValue;
  if (value === null) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value = '${value}'`,
        whereQuery: null,
      };
    case 'is_not_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value != '${value}'`,
        whereQuery: null,
      };
    case 'contains':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'does_not_contain':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value NOT LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'starts_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '${value}%'`,
        whereQuery: null,
      };
    case 'ends_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}'`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildEmailFilterQuery = (
  filter: ViewFilterNode,
  field: EmailFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const value = filter.values[0].textValue;
  if (value === null) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value = '${value}'`,
        whereQuery: null,
      };
    case 'is_not_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value != '${value}'`,
        whereQuery: null,
      };
    case 'contains':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'does_not_contain':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value NOT LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'starts_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '${value}%'`,
        whereQuery: null,
      };
    case 'ends_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}'`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildPhoneFilterQuery = (
  filter: ViewFilterNode,
  field: PhoneFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const value = filter.values[0].textValue;
  if (value === null) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value = '${value}'`,
        whereQuery: null,
      };
    case 'is_not_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value != '${value}'`,
        whereQuery: null,
      };
    case 'contains':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'does_not_contain':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value NOT LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'starts_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '${value}%'`,
        whereQuery: null,
      };
    case 'ends_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}'`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildUrlFilterQuery = (
  filter: ViewFilterNode,
  field: UrlFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const value = filter.values[0].textValue;
  if (value === null) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value = '${value}'`,
        whereQuery: null,
      };
    case 'is_not_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value != '${value}'`,
        whereQuery: null,
      };
    case 'contains':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'does_not_contain':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value NOT LIKE '%${value}%'`,
        whereQuery: null,
      };
    case 'starts_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '${value}%'`,
        whereQuery: null,
      };
    case 'ends_with':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.text_value LIKE '%${value}'`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildSelectFilterQuery = (
  filter: ViewFilterNode,
  field: SelectFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const ids = filter.values.map((value) => value.foreignNodeId);
  if (ids.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_in':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.foreign_node_id IN (${joinIds(ids)})`,
        whereQuery: null,
      };
    case 'is_not_in':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.foreign_node_id NOT IN (${joinIds(ids)})`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildMultiSelectFilterQuery = (
  filter: ViewFilterNode,
  field: MultiSelectFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const ids = filter.values.map((value) => value.foreignNodeId);
  if (ids.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_in':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.foreign_node_id IN (${joinIds(ids)})`,
        whereQuery: null,
      };
    case 'is_not_in':
      return {
        joinQuery: `${buildFilterLeftJoinNodeAttributesQuery(filter.id, field.id)} AND na_${filter.id}.foreign_node_id IN (${joinIds(ids)})`,
        whereQuery: `na_${filter.id}.node_id IS NULL`,
      };
    default:
      return null;
  }
};

const buildDateFilterQuery = (
  filter: ViewFilterNode,
  field: DateFieldNode,
): FilterQuery | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(filter.id, field.id);
  }

  if (filter.values.length === 0) {
    return null;
  }

  const value = filter.values[0].textValue;
  if (value === null) {
    return null;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }

  const dateString = date.toISOString().split('T')[0];
  switch (filter.operator) {
    case 'is_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND DATE(na_${filter.id}.text_value) = '${dateString}'`,
        whereQuery: null,
      };
    case 'is_not_equal_to':
      return {
        joinQuery: `${buildFilterLeftJoinNodeAttributesQuery(filter.id, field.id)} AND DATE(na_${filter.id}.text_value) != '${dateString}'`,
        whereQuery: null,
      };
    case 'is_on_or_after':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND DATE(na_${filter.id}.text_value) >= '${dateString}'`,
        whereQuery: null,
      };
    case 'is_on_or_before':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND DATE(na_${filter.id}.text_value) <= '${dateString}'`,
        whereQuery: null,
      };
    case 'is_after':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND DATE(na_${filter.id}.text_value) > '${dateString}'`,
        whereQuery: null,
      };
    case 'is_before':
      return {
        joinQuery: `${buildFilterJoinNodeAttributesQuery(filter.id, field.id)} AND DATE(na_${filter.id}.text_value) < '${dateString}'`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildCreatedAtFilterQuery = (
  filter: ViewFilterNode,
  field: CreatedAtFieldNode,
): FilterQuery | null => {
  if (filter.values.length === 0) {
    return null;
  }

  const value = filter.values[0].textValue;
  if (value === null) {
    return null;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }

  const dateString = date.toISOString().split('T')[0];
  switch (filter.operator) {
    case 'is_equal_to':
      return {
        joinQuery: `${buildFilterJoinNodesQuery(filter.id)} AND DATE(n_${filter.id}.created_at) = '${dateString}'`,
        whereQuery: null,
      };
    case 'is_not_equal_to':
      return {
        joinQuery: `${buildFilterLeftJoinNodesQuery(filter.id)} AND DATE(n_${filter.id}.created_at) != '${dateString}'`,
        whereQuery: null,
      };
    case 'is_on_or_after':
      return {
        joinQuery: `${buildFilterJoinNodesQuery(filter.id)} AND DATE(n_${filter.id}.created_at) >= '${dateString}'`,
        whereQuery: null,
      };
    case 'is_on_or_before':
      return {
        joinQuery: `${buildFilterJoinNodesQuery(filter.id)} AND DATE(n_${filter.id}.created_at) <= '${dateString}'`,
        whereQuery: null,
      };
    case 'is_after':
      return {
        joinQuery: `${buildFilterJoinNodesQuery(filter.id)} AND DATE(n_${filter.id}.created_at) > '${dateString}'`,
        whereQuery: null,
      };
    case 'is_before':
      return {
        joinQuery: `${buildFilterJoinNodesQuery(filter.id)} AND DATE(n_${filter.id}.created_at) < '${dateString}'`,
        whereQuery: null,
      };
    default:
      return null;
  }
};

const buildIsEmptyFilterQuery = (
  filterId: string,
  fieldId: string,
): FilterQuery => {
  return {
    joinQuery: buildFilterLeftJoinNodeAttributesQuery(filterId, fieldId),
    whereQuery: `na_${filterId}.node_id IS NULL`,
  };
};

const buildIsNotEmptyFilterQuery = (
  filterId: string,
  fieldId: string,
): FilterQuery => {
  return {
    joinQuery: buildFilterJoinNodeAttributesQuery(filterId, fieldId),
    whereQuery: null,
  };
};

const buildFilterJoinNodesQuery = (filterId: string): string => {
  return `JOIN nodes n_${filterId} ON n_${filterId}.id = na.node_id`;
};

const buildFilterLeftJoinNodesQuery = (filterId: string): string => {
  return `LEFT JOIN nodes n_${filterId} ON n_${filterId}.id = na.node_id`;
};

const buildFilterJoinNodeAttributesQuery = (
  filterId: string,
  fieldId: string,
): string => {
  return `JOIN node_attributes na_${filterId} ON na_${filterId}.node_id = na.node_id AND na_${filterId}.type = '${fieldId}'`;
};

const buildFilterLeftJoinNodeAttributesQuery = (
  filterId: string,
  fieldId: string,
): string => {
  return `LEFT JOIN node_attributes na_${filterId} ON na_${filterId}.node_id = na.node_id AND na_${filterId}.type = '${fieldId}'`;
};

const joinIds = (ids: string[]): string => {
  return ids.map((id) => `'${id}'`).join(',');
};

const buildSortJoinsQuery = (
  sorts: ViewSortNode[],
  fields: FieldNode[],
): string => {
  if (sorts.length === 0) {
    return '';
  }

  const joinQueries = sorts
    .map((sort) => buildSortJoinQuery(sort, fields))
    .filter((query) => query !== null && query.length > 0);

  return joinQueries.join(' ');
};

const buildSortJoinQuery = (
  sort: ViewSortNode,
  fields: FieldNode[],
): string | null => {
  const field = fields.find((field) => field.id === sort.fieldId);
  if (!field) {
    return null;
  }

  switch (field.dataType) {
    case 'boolean':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    case 'collaborator':
      return null;
    case 'created_at':
      return buildSortLeftJoinNodesQuery(sort.id);
    case 'created_by':
      return null;
    case 'date':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    case 'email':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    case 'file':
      return null;
    case 'multi_select':
      return null;
    case 'number':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    case 'phone':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    case 'select':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    case 'text':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    case 'url':
      return buildSortLeftJoinNodeAttributesQuery(sort.id, field.id);
    default:
      return null;
  }
};

const buildSortOrdersQuery = (
  sorts: ViewSortNode[],
  fields: FieldNode[],
): string => {
  return sorts
    .map((sort) => buildSortOrderQuery(sort, fields))
    .filter((query) => query !== null && query.length > 0)
    .join(', ');
};

const buildSortOrderQuery = (
  sort: ViewSortNode,
  fields: FieldNode[],
): string | null => {
  const field = fields.find((field) => field.id === sort.fieldId);
  if (!field) {
    return null;
  }

  switch (field.dataType) {
    case 'boolean':
      return `na_${sort.id}.number_value ${sort.direction}`;
    case 'collaborator':
      return null;
    case 'created_at':
      return `n_${sort.id}.created_at ${sort.direction}`;
    case 'created_by':
      return null;
    case 'date':
      return `na_${sort.id}.text_value ${sort.direction}`;
    case 'email':
      return `na_${sort.id}.text_value ${sort.direction}`;
    case 'file':
      return null;
    case 'multi_select':
      return null;
    case 'number':
      return `na_${sort.id}.number_value ${sort.direction}`;
    case 'phone':
      return `na_${sort.id}.text_value ${sort.direction}`;
    case 'select':
      return `na_${sort.id}.text_value ${sort.direction}`;
    case 'text':
      return `na_${sort.id}.text_value ${sort.direction}`;
    case 'url':
      return `na_${sort.id}.text_value ${sort.direction}`;
    default:
      return null;
  }
};

const buildSortLeftJoinNodesQuery = (sortId: string): string => {
  return `LEFT JOIN nodes n_${sortId} ON n_${sortId}.id = n.id`;
};

const buildSortLeftJoinNodeAttributesQuery = (
  sortId: string,
  fieldId: string,
): string => {
  return `LEFT JOIN node_attributes na_${sortId} ON na_${sortId}.node_id = n.id AND na_${sortId}.type = '${fieldId}'`;
};
