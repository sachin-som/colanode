import { Entry } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectEntry } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { EntryChildrenGetQueryInput } from '@/shared/queries/entries/entry-children-get';
import { Event } from '@/shared/types/events';

export class EntryChildrenGetQueryHandler
  implements QueryHandler<EntryChildrenGetQueryInput>
{
  public async handleQuery(
    input: EntryChildrenGetQueryInput
  ): Promise<Entry[]> {
    const rows = await this.fetchChildren(input);
    return rows.map(mapEntry);
  }

  public async checkForChanges(
    event: Event,
    input: EntryChildrenGetQueryInput,
    output: Entry[]
  ): Promise<ChangeCheckResult<EntryChildrenGetQueryInput>> {
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
      event.entry.parentId === input.entryId &&
      (input.types === undefined || input.types.includes(event.entry.type))
    ) {
      const newChildren = [...output, event.entry];
      return {
        hasChanges: true,
        result: newChildren,
      };
    }

    if (
      event.type === 'entry_updated' &&
      event.userId === input.userId &&
      event.entry.parentId === input.entryId &&
      (input.types === undefined || input.types.includes(event.entry.type))
    ) {
      const entry = output.find((entry) => entry.id === event.entry.id);
      if (entry) {
        const newChildren = output.map((entry) =>
          entry.id === event.entry.id ? event.entry : entry
        );

        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    if (
      event.type === 'entry_deleted' &&
      event.userId === input.userId &&
      event.entry.parentId === input.entryId &&
      (input.types === undefined || input.types.includes(event.entry.type))
    ) {
      const entry = output.find((entry) => entry.id === event.entry.id);
      if (entry) {
        const newChildren = output.filter(
          (entry) => entry.id !== event.entry.id
        );
        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchChildren(
    input: EntryChildrenGetQueryInput
  ): Promise<SelectEntry[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('parent_id', '=', input.entryId)
      .where('type', 'in', input.types ?? [])
      .execute();

    return rows;
  }
}
