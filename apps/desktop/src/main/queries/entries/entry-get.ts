import { Entry } from '@colanode/core';

import { SelectEntry } from '@/main/databases/workspace';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapEntry } from '@/main/lib/mappers';
import { EntryGetQueryInput } from '@/shared/queries/entries/entry-get';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class EntryGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<EntryGetQueryInput>
{
  public async handleQuery(input: EntryGetQueryInput): Promise<Entry | null> {
    const row = await this.fetchEntry(input);
    return row ? mapEntry(row) : null;
  }

  public async checkForChanges(
    event: Event,
    input: EntryGetQueryInput,
    _: Entry | null
  ): Promise<ChangeCheckResult<EntryGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'entry_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.id === input.entryId
    ) {
      return {
        hasChanges: true,
        result: event.entry,
      };
    }

    if (
      event.type === 'entry_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.id === input.entryId
    ) {
      return {
        hasChanges: true,
        result: event.entry,
      };
    }

    if (
      event.type === 'entry_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.entry.id === input.entryId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchEntry(
    input: EntryGetQueryInput
  ): Promise<SelectEntry | undefined> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const row = await workspace.database
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', input.entryId)
      .executeTakeFirst();

    return row;
  }
}
