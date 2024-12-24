import { Entry } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectEntry } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { EntryGetQueryInput } from '@/shared/queries/entries/entry-get';
import { Event } from '@/shared/types/events';

export class EntryGetQueryHandler implements QueryHandler<EntryGetQueryInput> {
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
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'entry_created' &&
      event.userId === input.userId &&
      event.entry.id === input.entryId
    ) {
      return {
        hasChanges: true,
        result: event.entry,
      };
    }

    if (
      event.type === 'entry_updated' &&
      event.userId === input.userId &&
      event.entry.id === input.entryId
    ) {
      return {
        hasChanges: true,
        result: event.entry,
      };
    }

    if (
      event.type === 'entry_deleted' &&
      event.userId === input.userId &&
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
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const row = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', input.entryId)
      .executeTakeFirst();

    return row;
  }
}
