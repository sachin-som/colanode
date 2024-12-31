import { Entry } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectEntry } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { fetchEntryAncestors, mapEntry } from '@/main/utils';
import { EntryTreeGetQueryInput } from '@/shared/queries/entries/entry-tree-get';
import { Event } from '@/shared/types/events';

export class EntryTreeGetQueryHandler
  implements QueryHandler<EntryTreeGetQueryInput>
{
  public async handleQuery(input: EntryTreeGetQueryInput): Promise<Entry[]> {
    const rows = await this.fetchEntries(input);
    return rows.map(mapEntry);
  }

  public async checkForChanges(
    event: Event,
    input: EntryTreeGetQueryInput,
    output: Entry[]
  ): Promise<ChangeCheckResult<EntryTreeGetQueryInput>> {
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
      event.entry.id === input.entryId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (event.type === 'entry_updated' && event.userId === input.userId) {
      const entry = output.find((entry) => entry.id === event.entry.id);
      if (entry) {
        const newEntries = output.map((entry) => {
          if (entry.id === event.entry.id) {
            return event.entry;
          }
          return entry;
        });

        return {
          hasChanges: true,
          result: newEntries,
        };
      }
    }

    if (event.type === 'entry_deleted' && event.userId === input.userId) {
      const entry = output.find((entry) => entry.id === event.entry.id);
      if (entry) {
        const newResult = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchEntries(
    input: EntryTreeGetQueryInput
  ): Promise<SelectEntry[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await fetchEntryAncestors(workspaceDatabase, input.entryId);
    if (rows.length === 0) {
      return [];
    }

    const result: SelectEntry[] = [];

    let entry = rows.find((row) => row.id === input.entryId);
    if (!entry) {
      return [];
    }

    while (entry) {
      result.unshift(entry);
      entry = rows.find(
        (row) => row.id !== entry?.id && row.id === entry?.parent_id
      );

      if (!entry) {
        break;
      }
    }

    return result;
  }
}
