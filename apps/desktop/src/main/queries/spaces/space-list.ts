import { SpaceEntry } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectEntry } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapEntry } from '@/main/utils';
import { SpaceListQueryInput } from '@/shared/queries/spaces/space-list';
import { Event } from '@/shared/types/events';

export class SpaceListQueryHandler
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
      event.userId === input.userId &&
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
      event.userId === input.userId &&
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
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('type', '=', 'space')
      .execute();

    return rows;
  }
}
