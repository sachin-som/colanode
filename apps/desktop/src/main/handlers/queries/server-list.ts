import { ServerListQueryInput } from '@/operations/queries/server-list';
import { databaseService } from '@/main/data/database-service';
import { SelectServer } from '@/main/data/app/schema';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';
import { Server } from '@/types/servers';

export class ServerListQueryHandler
  implements QueryHandler<ServerListQueryInput>
{
  async handleQuery(
    _: ServerListQueryInput
  ): Promise<QueryResult<ServerListQueryInput>> {
    const rows = await this.fetchServers();
    return {
      output: this.mapServers(rows),
      state: {
        rows,
      },
    };
  }

  async checkForChanges(
    changes: MutationChange[],
    _: ServerListQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<ServerListQueryInput>> {
    if (
      !changes.some(
        (change) => change.type === 'app' && change.table === 'servers'
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchServers();
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.mapServers(rows),
        state: {
          rows,
        },
      },
    };
  }

  private fetchServers(): Promise<SelectServer[]> {
    return databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .execute();
  }

  private mapServers = (rows: SelectServer[]): Server[] => {
    return rows.map((row) => {
      return {
        domain: row.domain,
        name: row.name,
        avatar: row.avatar,
        attributes: JSON.parse(row.attributes),
        version: row.version,
        createdAt: new Date(row.created_at),
        lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
      };
    });
  };
}
