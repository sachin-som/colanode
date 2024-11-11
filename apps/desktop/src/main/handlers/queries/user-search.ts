import { UserSearchQueryInput } from '@/operations/queries/user-search';
import { databaseManager } from '@/main/data/database-manager';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@colanode/core';
import { UserNode } from '@colanode/core';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';
import { mapNode } from '@/main/utils';

export class UserSearchQueryHandler
  implements QueryHandler<UserSearchQueryInput>
{
  public async handleQuery(
    input: UserSearchQueryInput
  ): Promise<QueryResult<UserSearchQueryInput>> {
    const rows =
      input.searchQuery.length > 0
        ? await this.searchUsers(input)
        : await this.fetchUsers(input);
    return {
      output: this.buildUserNodes(rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: UserSearchQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<UserSearchQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows =
      input.searchQuery.length > 0
        ? await this.searchUsers(input)
        : await this.fetchUsers(input);

    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildUserNodes(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async searchUsers(
    input: UserSearchQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    const query = sql<SelectNode>`
      SELECT n.*
      FROM nodes n
      JOIN node_names nn ON n.id = nn.id
      WHERE n.type = ${NodeTypes.User}
        AND n.id != ${input.userId}
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

  private async fetchUsers(input: UserSearchQueryInput): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    return workspaceDatabase
      .selectFrom('nodes')
      .where('type', '=', NodeTypes.User)
      .where('id', '!=', input.userId)
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildUserNodes = (rows: SelectNode[]): UserNode[] => {
    return rows.map((row) => mapNode(row) as UserNode);
  };
}
