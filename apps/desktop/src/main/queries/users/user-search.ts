import { sql } from 'kysely';

import { databaseService } from '@/main/data/database-service';
import { SelectUser } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapUser } from '@/main/utils';
import { UserSearchQueryInput } from '@/shared/queries/users/user-search';
import { Event } from '@/shared/types/events';
import { User } from '@/shared/types/users';

export class UserSearchQueryHandler
  implements QueryHandler<UserSearchQueryInput>
{
  public async handleQuery(input: UserSearchQueryInput): Promise<User[]> {
    const rows =
      input.searchQuery.length > 0
        ? await this.searchUsers(input)
        : await this.fetchUsers(input);

    return this.buildUserNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: UserSearchQueryInput,
    _: User[]
  ): Promise<ChangeCheckResult<UserSearchQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (event.type === 'user_created' && event.userId === input.userId) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (event.type === 'user_updated' && event.userId === input.userId) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (event.type === 'user_deleted' && event.userId === input.userId) {
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

  private async searchUsers(
    input: UserSearchQueryInput
  ): Promise<SelectUser[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    const query = sql<SelectUser>`
      SELECT u.*
      FROM users u
      JOIN node_names nn ON u.id = nn.id
      WHERE u.id != ${input.userId}
        AND nn.name MATCH ${input.searchQuery + '*'}
        ${
          exclude.length > 0
            ? sql`AND u.id NOT IN (${sql.join(
                exclude.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql``
        }
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private async fetchUsers(input: UserSearchQueryInput): Promise<SelectUser[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    return workspaceDatabase
      .selectFrom('users')
      .where('id', '!=', input.userId)
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildUserNodes = (rows: SelectUser[]): User[] => {
    return rows.map((row) => mapUser(row));
  };
}
