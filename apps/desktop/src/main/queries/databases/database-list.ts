import { compareString, DatabaseEntry } from '@colanode/core';

import { SelectEntry } from '@/main/databases/workspace';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { DatabaseListQueryInput } from '@/shared/queries/databases/database-list';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class DatabaseListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DatabaseListQueryInput>
{
  public async handleQuery(
    input: DatabaseListQueryInput
  ): Promise<DatabaseEntry[]> {
    const databases = await this.fetchDatabases(input);
    return this.buildDatabases(databases);
  }

  public async checkForChanges(
    event: Event,
    input: DatabaseListQueryInput,
    output: DatabaseEntry[]
  ): Promise<ChangeCheckResult<DatabaseListQueryInput>> {
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
      event.entry.type === 'database'
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
      event.entry.type === 'database'
    ) {
      const database = output.find(
        (database) => database.id === event.entry.id
      );
      if (database) {
        const newResult = output.map((database) => {
          if (database.id === event.entry.id) {
            return event.entry as DatabaseEntry;
          }
          return database;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'entry_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.type === 'database'
    ) {
      const database = output.find(
        (database) => database.id === event.entry.id
      );

      if (database) {
        const newOutput = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchDatabases(
    input: DatabaseListQueryInput
  ): Promise<SelectEntry[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const databases = await workspace.database
      .selectFrom('entries')
      .where('type', '=', 'database')
      .selectAll()
      .execute();

    return databases;
  }

  private buildDatabases = (rows: SelectEntry[]): DatabaseEntry[] => {
    const entries = rows.map(mapEntry);
    const databaseEntries: DatabaseEntry[] = [];

    for (const entry of entries) {
      if (entry.type !== 'database') {
        continue;
      }

      databaseEntries.push(entry);
    }

    return databaseEntries.sort((a, b) => compareString(a.id, b.id));
  };
}
