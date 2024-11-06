import fs from 'fs';
import { databaseManager } from '@/main/data/database-manager';
import { LogoutMutationInput } from '@/operations/mutations/logout';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import {
  getAccountAvatarsDirectoryPath,
  getWorkspaceDirectoryPath,
} from '@/main/utils';

export class LogoutMutationHandler
  implements MutationHandler<LogoutMutationInput>
{
  async handleMutation(
    input: LogoutMutationInput,
  ): Promise<MutationResult<LogoutMutationInput>> {
    const account = await databaseManager.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      return {
        output: {
          success: false,
        },
      };
    }

    const workspaces = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', account.id)
      .execute();

    for (const workspace of workspaces) {
      await databaseManager.deleteWorkspaceDatabase(workspace.user_id);

      const workspaceDir = getWorkspaceDirectoryPath(workspace.user_id);
      if (fs.existsSync(workspaceDir)) {
        fs.rmSync(workspaceDir, { recursive: true });
      }
    }

    const avatarsDir = getAccountAvatarsDirectoryPath(account.id);
    if (fs.existsSync(avatarsDir)) {
      fs.rmSync(avatarsDir, { recursive: true });
    }

    await databaseManager.appDatabase
      .deleteFrom('accounts')
      .where('id', '=', account.id)
      .execute();

    await databaseManager.appDatabase
      .deleteFrom('workspaces')
      .where('account_id', '=', account.id)
      .execute();

    await databaseManager.appDatabase
      .insertInto('deleted_tokens')
      .values({
        token: account.token,
        account_id: account.id,
        server: account.server,
        created_at: new Date().toISOString(),
      })
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'app',
          table: 'accounts',
        },
      ],
    };
  }
}
