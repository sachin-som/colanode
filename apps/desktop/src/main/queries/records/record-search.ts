import { RecordEntry } from '@colanode/core';
import { sql } from 'kysely';

import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { RecordSearchQueryInput } from '@/shared/queries/records/record-search';
import { Event } from '@/shared/types/events';
import { SelectEntry } from '@/main/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class RecordSearchQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<RecordSearchQueryInput>
{
  public async handleQuery(
    input: RecordSearchQueryInput
  ): Promise<RecordEntry[]> {
    const rows =
      input.searchQuery.length > 0
        ? await this.searchRecords(input)
        : await this.fetchRecords(input);

    return this.buildRecordEntries(rows);
  }

  public async checkForChanges(
    event: Event,
    input: RecordSearchQueryInput,
    _: RecordEntry[]
  ): Promise<ChangeCheckResult<RecordSearchQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'entry_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.type === 'record' &&
      event.entry.attributes.databaseId === input.databaseId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'entry_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.type === 'record' &&
      event.entry.attributes.databaseId === input.databaseId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'entry_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.type === 'record' &&
      event.entry.attributes.databaseId === input.databaseId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async searchRecords(
    input: RecordSearchQueryInput
  ): Promise<SelectEntry[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const exclude = input.exclude ?? [];
    const query = sql<SelectEntry>`
      SELECT e.*
      FROM entries e
      JOIN entry_names en ON e.id = en.id
      WHERE e.type = 'record'
        AND e.parent_id = ${input.databaseId}
        AND en.name MATCH ${input.searchQuery + '*'}
        ${
          exclude.length > 0
            ? sql`AND e.id NOT IN (${sql.join(
                exclude.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql``
        }
    `.compile(workspace.database);

    const result = await workspace.database.executeQuery(query);
    return result.rows;
  }

  private async fetchRecords(
    input: RecordSearchQueryInput
  ): Promise<SelectEntry[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const exclude = input.exclude ?? [];
    return workspace.database
      .selectFrom('entries')
      .where('type', '=', 'record')
      .where('parent_id', '=', input.databaseId)
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildRecordEntries = (rows: SelectEntry[]): RecordEntry[] => {
    return rows.map((row) => mapEntry(row) as RecordEntry);
  };
}
