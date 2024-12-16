import { compareString, DatabaseNode } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { DatabaseListQueryInput } from '@/shared/queries/databases/database-list';
import { Event } from '@/shared/types/events';

export class DatabaseListQueryHandler
  implements QueryHandler<DatabaseListQueryInput>
{
  public async handleQuery(
    input: DatabaseListQueryInput
  ): Promise<DatabaseNode[]> {
    const databases = await this.fetchDatabases(input);
    return this.buildDatabases(databases);
  }

  public async checkForChanges(
    event: Event,
    input: DatabaseListQueryInput,
    output: DatabaseNode[]
  ): Promise<ChangeCheckResult<DatabaseListQueryInput>> {
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
      event.type === 'node_created' &&
      event.userId === input.userId &&
      event.node.type === 'database'
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node_updated' &&
      event.userId === input.userId &&
      event.node.type === 'database'
    ) {
      const database = output.find((database) => database.id === event.node.id);
      if (database) {
        const newResult = output.map((database) => {
          if (database.id === event.node.id) {
            return event.node as DatabaseNode;
          }
          return database;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.type === 'database'
    ) {
      const database = output.find((database) => database.id === event.node.id);

      if (database) {
        const newOutput = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchDatabases(
    input: DatabaseListQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const databases = await workspaceDatabase
      .selectFrom('nodes')
      .where('type', '=', 'database')
      .selectAll()
      .execute();

    return databases;
  }

  private buildDatabases = (rows: SelectNode[]): DatabaseNode[] => {
    const nodes = rows.map(mapNode);
    const databaseNodes: DatabaseNode[] = [];

    for (const node of nodes) {
      if (node.type !== 'database') {
        continue;
      }

      databaseNodes.push(node);
    }

    return databaseNodes.sort((a, b) => compareString(a.id, b.id));
  };
}
