import { Entry } from '@colanode/core';

import { SelectEntry } from '@/main/databases/workspace';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { fetchEntryAncestors, mapEntry } from '@/main/utils';
import { EntryTreeGetQueryInput } from '@/shared/queries/entries/entry-tree-get';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class EntryTreeGetQueryHandler
  extends WorkspaceQueryHandlerBase
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
      event.entry.id === input.entryId
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
      event.workspaceId === input.workspaceId
    ) {
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

    if (
      event.type === 'entry_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
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
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const rows = await fetchEntryAncestors(workspace.database, input.entryId);
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
