import { RecordEntry } from '@colanode/core';
import { sql } from 'kysely';

import { databaseService } from '@/main/data/database-service';
import { SelectEntry } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { RecordSearchQueryInput } from '@/shared/queries/records/record-search';
import { Event } from '@/shared/types/events';

export class RecordSearchQueryHandler
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
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'entry_created' &&
      event.userId === input.userId &&
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
      event.userId === input.userId &&
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
      event.userId === input.userId &&
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
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

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
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private async fetchRecords(
    input: RecordSearchQueryInput
  ): Promise<SelectEntry[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    return workspaceDatabase
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
