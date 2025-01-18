import { SpaceEntry } from '@colanode/core';

import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapEntry } from '@/main/lib/mappers';
import { SpaceListQueryInput } from '@/shared/queries/spaces/space-list';
import { Event } from '@/shared/types/events';
import { SelectEntry } from '@/main/databases/workspace';

export class SpaceListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<SpaceListQueryInput>
{
  public async handleQuery(input: SpaceListQueryInput): Promise<SpaceEntry[]> {
    const rows = await this.fetchChildren(input);
    return rows.map(mapEntry) as SpaceEntry[];
  }

  public async checkForChanges(
    event: Event,
    input: SpaceListQueryInput,
    output: SpaceEntry[]
  ): Promise<ChangeCheckResult<SpaceListQueryInput>> {
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
      event.entry.type === 'space'
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
      event.entry.type === 'space'
    ) {
      const entry = output.find((entry) => entry.id === event.entry.id);
      if (entry) {
        const newChildren = output.map((entry) =>
          entry.id === event.entry.id ? (event.entry as SpaceEntry) : entry
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
      event.entry.type === 'space'
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
    input: SpaceListQueryInput
  ): Promise<SelectEntry[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const rows = await workspace.database
      .selectFrom('entries')
      .selectAll()
      .where('parent_id', 'is', null)
      .where('type', '=', 'space')
      .execute();

    return rows;
  }
}
