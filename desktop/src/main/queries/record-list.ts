import { RecordListQueryInput } from '@/types/queries/record-list';
import { databaseManager } from '@/main/data/database-manager';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { MutationChange } from '@/types/mutations';
import { SelectNode } from '@/main/data/workspace/schema';
import { sql } from 'kysely';
import {
  BooleanFieldNode,
  CreatedAtFieldNode,
  DatabaseNode,
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
import { isStringArray } from '@/lib/utils';
import { UserNode } from '@/types/users';
import { mapNode } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';
import { DatabaseGetQueryHandler } from '@/main/queries/database-get';
import { isEqual } from 'lodash';

export class RecordListQueryHandler
  implements QueryHandler<RecordListQueryInput>
{
  public async handleQuery(
    input: RecordListQueryInput,
  ): Promise<QueryResult<RecordListQueryInput>> {
    const rows = await this.fetchRecords(input);

    return {
      output: this.buildRecords(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: RecordListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<RecordListQueryInput>> {
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

    const rows = await this.fetchRecords(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildRecords(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchRecords(
    input: RecordListQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const database = await this.fetchDatabase(input.userId, input.databaseId);
    const filterQuery = this.buildFiltersQuery(input.filters, database.fields);
    const orderByQuery = `ORDER BY ${input.sorts.length > 0 ? this.buildSortOrdersQuery(input.sorts, database.fields) : 'n."index" ASC'}`;
    const offset = input.page * input.count;
    const query = sql<SelectNode>`
        WITH record_nodes AS (
          SELECT n.*, ROW_NUMBER() OVER (${sql.raw(orderByQuery)}) AS order_number
          FROM nodes n
          WHERE n.parent_id = ${input.databaseId} AND n.type = ${NodeTypes.Record} ${sql.raw(filterQuery)}
          ${sql.raw(orderByQuery)}
          LIMIT ${sql.lit(input.count)}
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
      `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildRecords = (rows: SelectNode[]): RecordNode[] => {
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

  private async fetchDatabase(
    userId: string,
    databaseId: string,
  ): Promise<DatabaseNode> {
    const handler = new DatabaseGetQueryHandler();
    const result = await handler.handleQuery({
      type: 'database_get',
      databaseId: databaseId,
      userId: userId,
    });
    return result.output;
  }

  private buildFiltersQuery = (
    filters: ViewFilter[],
    fields: FieldNode[],
  ): string => {
    if (filters.length === 0) {
      return '';
    }

    const filterQueries = filters
      .map((filter) => this.buildFilterQuery(filter, fields))
      .filter((query) => query !== null);

    if (filterQueries.length === 0) {
      return '';
    }

    return `AND (${filterQueries.join(' AND ')})`;
  };

  private buildFilterQuery = (
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
        return this.buildBooleanFilterQuery(filter, field);
      case 'collaborator':
        return null;
      case 'created_at':
        return this.buildCreatedAtFilterQuery(filter, field);
      case 'created_by':
        return null;
      case 'date':
        return this.buildDateFilterQuery(filter, field);
      case 'email':
        return this.buildEmailFilterQuery(filter, field);
      case 'file':
        return null;
      case 'multi_select':
        return this.buildMultiSelectFilterQuery(filter, field);
      case 'number':
        return this.buildNumberFilterQuery(filter, field);
      case 'phone':
        return this.buildPhoneFilterQuery(filter, field);
      case 'select':
        return this.buildSelectFilterQuery(filter, field);
      case 'text':
        return this.buildTextFilterQuery(filter, field);
      case 'url':
        return this.buildUrlFilterQuery(filter, field);
      default:
        return null;
    }
  };

  buildBooleanFilterQuery = (
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

  private buildNumberFilterQuery = (
    filter: ViewFieldFilter,
    field: NumberFieldNode,
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
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

  private buildTextFilterQuery = (
    filter: ViewFieldFilter,
    field: TextFieldNode,
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
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

  private buildEmailFilterQuery = (
    filter: ViewFilter,
    field: EmailFieldNode,
  ): string | null => {
    if (filter.type === 'group') {
      return null;
    }

    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
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

  private buildPhoneFilterQuery = (
    filter: ViewFieldFilter,
    field: PhoneFieldNode,
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
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

  private buildUrlFilterQuery = (
    filter: ViewFieldFilter,
    field: UrlFieldNode,
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
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

  private buildSelectFilterQuery = (
    filter: ViewFieldFilter,
    field: SelectFieldNode,
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (!isStringArray(filter.value)) {
      return null;
    }

    if (filter.value.length === 0) {
      return null;
    }

    const values = this.joinIds(filter.value);
    switch (filter.operator) {
      case 'is_in':
        return `json_extract(n.attributes, '$.${field.id}') IN (${values})`;
      case 'is_not_in':
        return `json_extract(n.attributes, '$.${field.id}') NOT IN (${values})`;
      default:
        return null;
    }
  };

  private buildMultiSelectFilterQuery = (
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

    if (filter.value.length === 0) {
      return null;
    }

    const values = this.joinIds(filter.value);
    switch (filter.operator) {
      case 'is_in':
        return `EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.${field.id}')) WHERE json_each.value IN (${values}))`;
      case 'is_not_in':
        return `NOT EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.${field.id}')) WHERE json_each.value IN (${values}))`;
      default:
        return null;
    }
  };

  private buildDateFilterQuery = (
    filter: ViewFieldFilter,
    field: DateFieldNode,
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
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

  private buildCreatedAtFilterQuery = (
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

  private buildIsEmptyFilterQuery = (fieldId: string): string => {
    return `json_extract(n.attributes, '$.${fieldId}') IS NULL`;
  };

  private buildIsNotEmptyFilterQuery = (fieldId: string): string => {
    return `json_extract(n.attributes, '$.${fieldId}') IS NOT NULL`;
  };

  private joinIds = (ids: string[]): string => {
    return ids.map((id) => `'${id}'`).join(',');
  };

  private buildSortOrdersQuery = (
    sorts: ViewSort[],
    fields: FieldNode[],
  ): string => {
    return sorts
      .map((sort) => this.buildSortOrderQuery(sort, fields))
      .filter((query) => query !== null && query.length > 0)
      .join(', ');
  };

  private buildSortOrderQuery = (
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
}
