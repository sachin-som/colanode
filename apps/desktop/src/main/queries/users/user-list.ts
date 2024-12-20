import { databaseService } from '@/main/data/database-service';
import { SelectUser } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapUser } from '@/main/utils';
import { UserListQueryInput } from '@/shared/queries/users/user-list';
import { Event } from '@/shared/types/events';
import { User } from '@/shared/types/users';

export class UserListQueryHandler implements QueryHandler<UserListQueryInput> {
  public async handleQuery(input: UserListQueryInput): Promise<User[]> {
    const rows = await this.fetchUsers(input);
    return this.buildWorkspaceUserNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: UserListQueryInput,
    output: User[]
  ): Promise<ChangeCheckResult<UserListQueryInput>> {
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
      const user = output.find((user) => user.id === event.userId);
      if (user) {
        const newUsers = output.map((user) => {
          if (user.id === event.user.id) {
            return event.user;
          }
          return user;
        });

        return {
          hasChanges: true,
          result: newUsers,
        };
      }
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

  private async fetchUsers(input: UserListQueryInput): Promise<SelectUser[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const offset = (input.page - 1) * input.count;
    const rows = await workspaceDatabase
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at asc')
      .offset(offset)
      .limit(input.count)
      .execute();

    return rows;
  }

  private buildWorkspaceUserNodes = (rows: SelectUser[]): User[] => {
    const users = rows.map(mapUser);
    return users;
  };
}
