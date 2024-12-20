import { databaseService } from '@/main/data/database-service';
import { SelectUser } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapUser } from '@/main/utils';
import { UserGetQueryInput } from '@/shared/queries/users/user-get';
import { Event } from '@/shared/types/events';
import { User } from '@/shared/types/users';

export class UserGetQueryHandler implements QueryHandler<UserGetQueryInput> {
  public async handleQuery(input: UserGetQueryInput): Promise<User | null> {
    const row = await this.fetchUser(input);
    return row ? mapUser(row) : null;
  }

  public async checkForChanges(
    event: Event,
    input: UserGetQueryInput,
    _: User | null
  ): Promise<ChangeCheckResult<UserGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'user_created' &&
      event.userId === input.userId &&
      event.user.id === input.id
    ) {
      return {
        hasChanges: true,
        result: event.user,
      };
    }

    if (
      event.type === 'user_updated' &&
      event.userId === input.userId &&
      event.user.id === input.id
    ) {
      return {
        hasChanges: true,
        result: event.user,
      };
    }

    if (
      event.type === 'user_deleted' &&
      event.userId === input.userId &&
      event.user.id === input.id
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchUser(
    input: UserGetQueryInput
  ): Promise<SelectUser | undefined> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const row = await workspaceDatabase
      .selectFrom('users')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    return row;
  }
}
