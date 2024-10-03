import { ServerListQueryInput } from '@/types/queries/server-list';
import { databaseContext } from '@/main/data/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { mapServer } from '@/lib/servers';
import { SelectServer } from '@/main/data/app/schema';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class ServerListQueryHandler
  implements QueryHandler<ServerListQueryInput>
{
  async handleQuery(
    _: ServerListQueryInput,
  ): Promise<QueryResult<ServerListQueryInput>> {
    const rows = await this.fetchServers();
    return {
      output: rows.map(mapServer),
      state: {
        rows,
      },
    };
  }

  async checkForChanges(
    changes: MutationChange[],
    _: ServerListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<ServerListQueryInput>> {
    if (
      !changes.some(
        (change) => change.type === 'app' && change.table === 'servers',
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
        output: rows.map(mapServer),
        state: {
          rows,
        },
      },
    };
  }

  private fetchServers(): Promise<SelectServer[]> {
    return databaseContext.appDatabase
      .selectFrom('servers')
      .selectAll()
      .execute();
  }
}
