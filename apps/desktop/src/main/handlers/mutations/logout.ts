import fs from 'fs';
import { databaseService } from '@/main/data/database-service';
import {
  LogoutMutationInput,
  LogoutMutationOutput,
} from '@/shared/mutations/logout';
import { MutationHandler } from '@/main/types';
import {
  getAccountAvatarsDirectoryPath,
  getWorkspaceDirectoryPath,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';

export class LogoutMutationHandler
  implements MutationHandler<LogoutMutationInput>
{
  async handleMutation(
    input: LogoutMutationInput
  ): Promise<LogoutMutationOutput> {
    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      return {
        success: false,
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

    const deletedAccount = await databaseService.appDatabase
      .deleteFrom('accounts')
      .returningAll()
      .where('id', '=', account.id)
      .executeTakeFirst();

    if (!deletedAccount) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'account_deleted',
      account: {
        id: deletedAccount.id,
        server: deletedAccount.server,
        name: deletedAccount.name,
        email: deletedAccount.email,
        avatar: deletedAccount.avatar,
        token: deletedAccount.token,
        deviceId: deletedAccount.device_id,
        status: deletedAccount.status,
      },
    });

    const deletedWorkspaces = await databaseService.appDatabase
      .deleteFrom('workspaces')
      .where('account_id', '=', account.id)
      .execute();

    if (deletedWorkspaces.length !== workspaces.length) {
      return {
        success: false,
      };
    }

    for (const workspace of workspaces) {
      eventBus.publish({
        type: 'workspace_deleted',
        workspace: {
          id: workspace.workspace_id,
          userId: workspace.user_id,
          name: workspace.name,
          avatar: workspace.avatar,
          description: workspace.description,
          role: workspace.role,
          versionId: workspace.version_id,
          accountId: workspace.account_id,
        },
      });
    }

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
      success: true,
    };
  }
}
