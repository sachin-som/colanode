import { Entry } from '@colanode/core';

import { SelectEntry } from '@/main/databases/workspace';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { Event } from '@/shared/types/events';
import { EntryChildrenGetQueryInput } from '@/shared/queries/entries/entry-children-get';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class EntryChildrenGetQueryHandler
  extends WorkspaceQueryHandlerBase
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
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
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
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
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
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const rows = await workspace.database
      .selectFrom('entries')
      .selectAll()
      .where('parent_id', '=', input.entryId)
      .where('type', 'in', input.types ?? [])
      .execute();

    return rows;
  }
}
