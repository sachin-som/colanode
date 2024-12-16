import { NodeTypes, RecordNode } from '@colanode/core';
import { sql } from 'kysely';

import { databaseService } from '@/main/data/database-service';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { RecordSearchQueryInput } from '@/shared/queries/records/record-search';
import { Event } from '@/shared/types/events';

export class RecordSearchQueryHandler
  implements QueryHandler<RecordSearchQueryInput>
{
  public async handleQuery(
    input: RecordSearchQueryInput
  ): Promise<RecordNode[]> {
    const rows =
      input.searchQuery.length > 0
        ? await this.searchRecords(input)
        : await this.fetchRecords(input);

    return this.buildRecordNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: RecordSearchQueryInput,
    _: RecordNode[]
  ): Promise<ChangeCheckResult<RecordSearchQueryInput>> {
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
      event.node.type === 'record' &&
      event.node.attributes.databaseId === input.databaseId
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
      event.node.type === 'record' &&
      event.node.attributes.databaseId === input.databaseId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.type === 'record' &&
      event.node.attributes.databaseId === input.databaseId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async searchRecords(
    input: RecordSearchQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    const query = sql<SelectNode>`
      SELECT n.*
      FROM nodes n
      JOIN node_names nn ON n.id = nn.id
      WHERE n.type = ${NodeTypes.Record}
        AND n.parent_id = ${input.databaseId}
        AND nn.name MATCH ${input.searchQuery + '*'}
        ${
          exclude.length > 0
            ? sql`AND n.id NOT IN (${sql.join(
                exclude.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql``
        }
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private async fetchRecords(
    input: RecordSearchQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    return workspaceDatabase
      .selectFrom('nodes')
      .where('type', '=', 'record')
      .where('parent_id', '=', input.databaseId)
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildRecordNodes = (rows: SelectNode[]): RecordNode[] => {
    return rows.map((row) => mapNode(row) as RecordNode);
  };
}
