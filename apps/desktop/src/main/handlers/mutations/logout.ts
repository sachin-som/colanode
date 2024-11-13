import fs from 'fs';
import { databaseService } from '@/main/data/database-service';
import { LogoutMutationInput } from '@/operations/mutations/logout';
import { MutationHandler, MutationResult } from '@/main/types';
import {
  getAccountAvatarsDirectoryPath,
  getWorkspaceDirectoryPath,
} from '@/main/utils';

export class LogoutMutationHandler
  implements MutationHandler<LogoutMutationInput>
{
  async handleMutation(
    input: LogoutMutationInput
  ): Promise<MutationResult<LogoutMutationInput>> {
    const account = await databaseService.appDatabase
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

    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', account.id)
      .execute();

    for (const workspace of workspaces) {
      await databaseService.deleteWorkspaceDatabase(workspace.user_id);

      const workspaceDir = getWorkspaceDirectoryPath(workspace.user_id);
      if (fs.existsSync(workspaceDir)) {
        fs.rmSync(workspaceDir, { recursive: true });
      }
    }

    const avatarsDir = getAccountAvatarsDirectoryPath(account.id);
    if (fs.existsSync(avatarsDir)) {
      fs.rmSync(avatarsDir, { recursive: true });
    }

    await databaseService.appDatabase
      .deleteFrom('accounts')
      .where('id', '=', account.id)
      .execute();

    await databaseService.appDatabase
      .deleteFrom('workspaces')
      .where('account_id', '=', account.id)
      .execute();

    await databaseService.appDatabase
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
        {
          type: 'app',
          table: 'workspaces',
        },
      ],
    };
  }
}
