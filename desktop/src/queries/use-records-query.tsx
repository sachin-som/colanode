import { useDatabase } from '@/contexts/database';
import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { isStringArray } from '@/lib/utils';
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
  ViewFieldFilter,
  ViewFilter,
  ViewSort,
} from '@/types/databases';
import { UserNode } from '@/types/users';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { sha256 } from 'js-sha256';
import { QueryResult, sql } from 'kysely';

const RECORDS_PER_PAGE = 50;

export const useRecordsQuery = (
  databaseId: string,
  filters: ViewFilter[],
  sorts: ViewSort[],
) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  let hash = '';
  if (filters.length > 0 || sorts.length > 0) {
    const json = JSON.stringify({ filters, sorts });
    hash = sha256(json);
  }

  return useInfiniteQuery<
    QueryResult<SelectNode>,
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
      const orderByQuery = `ORDER BY ${sorts.length > 0 ? buildSortOrdersQuery(sorts, database.fields) : 'n."index" ASC'}`;

      const query = sql<SelectNode>`
        WITH record_nodes AS (
          SELECT n.*, ROW_NUMBER() OVER (${sql.raw(orderByQuery)}) AS order_number
          FROM nodes n
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
        SELECT n.*
        FROM all_nodes n
        ORDER BY n.order_number ASC
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        page: pageParam,
        query,
      });
    },
    select: (data: InfiniteData<QueryResult<SelectNode>>): RecordNode[] => {
      const pages = data?.pages ?? [];
      const rows = pages.map((page) => page.rows).flat();
      return buildRecords(rows);
    },
  });
};

const buildRecords = (rows: SelectNode[]): RecordNode[] => {
  const nodes = rows.map(mapNode);
  const recordNodes = nodes.filter((node) => node.type === NodeTypes.Record);

  const authorNodes = nodes.filter((node) => node.type === NodeTypes.User);
  const records: RecordNode[] = [];
  const authorMap = new Map<string, UserNode>();

  for (const author of authorNodes) {
    const name = author.attributes.name;
    const avatar = author.attributes.avatar;
    const email = author.attributes.email;

    authorMap.set(author.id, {
      id: author.id,
      name: name ?? 'Unknown User',
      email,
      avatar,
    });
  }

  for (const node of recordNodes) {
    const name = node.attributes.name;
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
        email: 'unknown@neuron.com',
        avatar: null,
      },
      versionId: node.versionId,
    };

    records.push(record);
  }

  return records;
};

const buildFiltersQuery = (
  filters: ViewFilter[],
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

  return `AND (${filterQueries.join(' AND ')})`;
};

const buildFilterQuery = (
  filter: ViewFilter,
  fields: FieldNode[],
): string | null => {
  if (filter.type === 'group') {
    return null;
  }

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
  filter: ViewFieldFilter,
  field: BooleanFieldNode,
): string | null => {
  if (filter.operator === 'is_true') {
    return `json_extract(n.attributes, '$.${field.id}') = true`;
  }

  if (filter.operator === 'is_false') {
    return `(json_extract(n.attributes, '$.${field.id}') = false OR json_extract(n.attributes, '$.${field.id}') IS NULL)`;
  }

  return null;
};

const buildNumberFilterQuery = (
  filter: ViewFieldFilter,
  field: NumberFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(field.id);
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'number') {
    return null;
  }

  const value = filter.value as number;
  let operator: string | null;

  switch (filter.operator) {
    case 'is_equal_to':
      operator = '=';
      break;
    case 'is_not_equal_to':
      operator = '!=';
      break;
    case 'is_greater_than':
      operator = '>';
      break;
    case 'is_less_than':
      operator = '<';
      break;
    case 'is_greater_than_or_equal_to':
      operator = '>=';
      break;
    case 'is_less_than_or_equal_to':
      operator = '<=';
      break;
    default:
      return null;
  }

  if (operator === null) {
    return null;
  }

  return `json_extract(n.attributes, '$.${field.id}') ${operator} ${value}`;
};

const buildTextFilterQuery = (
  filter: ViewFieldFilter,
  field: TextFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(field.id);
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  let operator: string | null;
  let formattedValue = value;

  switch (filter.operator) {
    case 'is_equal_to':
      operator = '=';
      break;
    case 'is_not_equal_to':
      operator = '!=';
      break;
    case 'contains':
      operator = 'LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'does_not_contain':
      operator = 'NOT LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'starts_with':
      operator = 'LIKE';
      formattedValue = `${value}%`;
      break;
    case 'ends_with':
      operator = 'LIKE';
      formattedValue = `%${value}`;
      break;
    default:
      return null;
  }

  if (operator === null) {
    return null;
  }

  return `json_extract(n.attributes, '$.${field.id}') ${operator} '${formattedValue}'`;
};

const buildEmailFilterQuery = (
  filter: ViewFilter,
  field: EmailFieldNode,
): string | null => {
  if (filter.type === 'group') {
    return null;
  }

  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(field.id);
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  let operator: string | null;
  let formattedValue = value;

  switch (filter.operator) {
    case 'is_equal_to':
      operator = '=';
      break;
    case 'is_not_equal_to':
      operator = '!=';
      break;
    case 'contains':
      operator = 'LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'does_not_contain':
      operator = 'NOT LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'starts_with':
      operator = 'LIKE';
      formattedValue = `${value}%`;
      break;
    case 'ends_with':
      operator = 'LIKE';
      formattedValue = `%${value}`;
      break;
    default:
      return null;
  }

  if (operator === null) {
    return null;
  }

  return `json_extract(n.attributes, '$.${field.id}') ${operator} '${formattedValue}'`;
};

const buildPhoneFilterQuery = (
  filter: ViewFieldFilter,
  field: PhoneFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(field.id);
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  let operator: string | null;
  let formattedValue = value;

  switch (filter.operator) {
    case 'is_equal_to':
      operator = '=';
      break;
    case 'is_not_equal_to':
      operator = '!=';
      break;
    case 'contains':
      operator = 'LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'does_not_contain':
      operator = 'NOT LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'starts_with':
      operator = 'LIKE';
      formattedValue = `${value}%`;
      break;
    case 'ends_with':
      operator = 'LIKE';
      formattedValue = `%${value}`;
      break;
    default:
      return null;
  }

  if (operator === null) {
    return null;
  }

  return `json_extract(n.attributes, '$.${field.id}') ${operator} '${formattedValue}'`;
};

const buildUrlFilterQuery = (
  filter: ViewFieldFilter,
  field: UrlFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(field.id);
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  let operator: string | null;
  let formattedValue = value;

  switch (filter.operator) {
    case 'is_equal_to':
      operator = '=';
      break;
    case 'is_not_equal_to':
      operator = '!=';
      break;
    case 'contains':
      operator = 'LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'does_not_contain':
      operator = 'NOT LIKE';
      formattedValue = `%${value}%`;
      break;
    case 'starts_with':
      operator = 'LIKE';
      formattedValue = `${value}%`;
      break;
    case 'ends_with':
      operator = 'LIKE';
      formattedValue = `%${value}`;
      break;
    default:
      return null;
  }

  if (operator === null) {
    return null;
  }

  return `json_extract(n.attributes, '$.${field.id}') ${operator} '${formattedValue}'`;
};

const buildSelectFilterQuery = (
  filter: ViewFieldFilter,
  field: SelectFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(field.id);
  }

  if (!isStringArray(filter.value)) {
    return null;
  }

  const values = joinIds(filter.value);
  switch (filter.operator) {
    case 'is_in':
      return `json_extract(n.attributes, '$.${field.id}') IN (${values})`;
    case 'is_not_in':
      return `json_extract(n.attributes, '$.${field.id}') NOT IN (${values})`;
    default:
      return null;
  }
};

const buildMultiSelectFilterQuery = (
  filter: ViewFieldFilter,
  field: MultiSelectFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return `json_extract(n.attributes, '$.${field.id}') IS NULL OR json_array_length(json_extract(n.attributes, '$.${field.id}')) = 0`;
  }

  if (filter.operator === 'is_not_empty') {
    return `json_extract(n.attributes, '$.${field.id}') IS NOT NULL AND json_array_length(json_extract(n.attributes, '$.${field.id}')) > 0`;
  }

  if (!isStringArray(filter.value)) {
    return null;
  }

  const values = joinIds(filter.value);
  switch (filter.operator) {
    case 'is_in':
      return `EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.${field.id}')) WHERE json_each.value IN (${values}))`;
    case 'is_not_in':
      return `NOT EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.${field.id}')) WHERE json_each.value IN (${values}))`;
    default:
      return null;
  }
};

const buildDateFilterQuery = (
  filter: ViewFieldFilter,
  field: DateFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildIsNotEmptyFilterQuery(field.id);
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const date = new Date(filter.value);
  if (isNaN(date.getTime())) {
    return null;
  }

  const dateString = date.toISOString().split('T')[0];
  let operator: string | null;

  switch (filter.operator) {
    case 'is_equal_to':
      operator = '=';
      break;
    case 'is_not_equal_to':
      operator = '!=';
      break;
    case 'is_on_or_after':
      operator = '>=';
      break;
    case 'is_on_or_before':
      operator = '<=';
      break;
    case 'is_after':
      operator = '>';
      break;
    case 'is_before':
      operator = '<';
      break;
    default:
      return null;
  }

  if (operator === null) {
    return null;
  }

  return `DATE(json_extract(n.attributes, '$.${field.id}')) ${operator} '${dateString}'`;
};

const buildCreatedAtFilterQuery = (
  filter: ViewFieldFilter,
  field: CreatedAtFieldNode,
): string | null => {
  if (filter.operator === 'is_empty') {
    return `n.created_at IS NULL`;
  }

  if (filter.operator === 'is_not_empty') {
    return `n.created_at IS NOT NULL`;
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const date = new Date(filter.value);
  if (isNaN(date.getTime())) {
    return null;
  }

  const dateString = date.toISOString().split('T')[0];
  let operator: string | null;

  switch (filter.operator) {
    case 'is_equal_to':
      operator = '=';
      break;
    case 'is_not_equal_to':
      operator = '!=';
      break;
    case 'is_on_or_after':
      operator = '>=';
      break;
    case 'is_on_or_before':
      operator = '<=';
      break;
    case 'is_after':
      operator = '>';
      break;
    case 'is_before':
      operator = '<';
      break;
    default:
      return null;
  }

  if (operator === null) {
    return null;
  }

  return `DATE(n.created_at) ${operator} '${dateString}'`;
};

const buildIsEmptyFilterQuery = (fieldId: string): string => {
  return `json_extract(n.attributes, '$.${fieldId}') IS NULL`;
};

const buildIsNotEmptyFilterQuery = (fieldId: string): string => {
  return `json_extract(n.attributes, '$.${fieldId}') IS NOT NULL`;
};

const joinIds = (ids: string[]): string => {
  return ids.map((id) => `'${id}'`).join(',');
};

const buildSortOrdersQuery = (
  sorts: ViewSort[],
  fields: FieldNode[],
): string => {
  return sorts
    .map((sort) => buildSortOrderQuery(sort, fields))
    .filter((query) => query !== null && query.length > 0)
    .join(', ');
};

const buildSortOrderQuery = (
  sort: ViewSort,
  fields: FieldNode[],
): string | null => {
  const field = fields.find((field) => field.id === sort.fieldId);
  if (!field) {
    return null;
  }

  if (field.dataType === 'created_at') {
    return `n.created_at ${sort.direction}`;
  }

  if (field.dataType === 'created_by') {
    return `n.created_by_id ${sort.direction}`;
  }

  return `json_extract(n.attributes, '$.${field.id}') ${sort.direction}`;
};
