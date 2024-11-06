import { UserSearchQueryInput } from '@/operations/queries/user-search';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes } from '@/lib/constants';
import { UserNode } from '@/types/users';
import { MutationChange } from '@/operations/mutations';
import { isEqual } from 'lodash';

export class UserSearchQueryHandler
  implements QueryHandler<UserSearchQueryInput>
{
  public async handleQuery(
    input: UserSearchQueryInput,
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
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<UserSearchQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId,
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
    input: UserSearchQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<SelectNode>`
      SELECT n.*
      FROM nodes n
      JOIN node_names nn ON n.id = nn.id
      WHERE n.type = ${NodeTypes.User}
        AND n.id != ${input.userId}
        AND nn.name MATCH ${input.searchQuery + '*'}
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private async fetchUsers(input: UserSearchQueryInput): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    return workspaceDatabase
      .selectFrom('nodes')
      .where('type', '=', NodeTypes.User)
      .where('id', '!=', input.userId)
      .selectAll()
      .execute();
  }

  private buildUserNodes = (rows: SelectNode[]): UserNode[] => {
    return rows.map((row) => {
      const attributes = JSON.parse(row.attributes);
      return {
        id: row.id,
        name: attributes.name,
        email: attributes.email,
        avatar: attributes.avatar,
      };
    });
  };
}
