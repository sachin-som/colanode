import { AccountSyncOutput, LoginSuccessOutput } from '@colanode/core';

import fs from 'fs';

import { createDebugger } from '@/main/debugger';
import { SelectAccount } from '@/main/data/app/schema';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import {
  getAccountAvatarsDirectoryPath,
  getWorkspaceDirectoryPath,
  mapAccount,
  mapWorkspace,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import { socketService } from '@/main/services/socket-service';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

class AccountService {
  private readonly debug = createDebugger('service:account');

  public async initAccount(output: LoginSuccessOutput, server: string) {
    const { createdAccount, createdWorkspaces } =
      await databaseService.appDatabase.transaction().execute(async (trx) => {
        const createdAccount = await trx
          .insertInto('accounts')
          .returningAll()
          .values({
            id: output.account.id,
            name: output.account.name,
            avatar: output.account.avatar,
            device_id: output.deviceId,
            email: output.account.email,
            token: output.token,
            server,
            status: 'active',
          })
          .executeTakeFirst();

        if (!createdAccount) {
          throw new MutationError(
            MutationErrorCode.AccountLoginFailed,
            'Failed to login with email and password! Please try again.'
          );
        }

        if (output.workspaces.length === 0) {
          return { createdAccount, createdWorkspaces: [] };
        }

        const createdWorkspaces = await trx
          .insertInto('workspaces')
          .returningAll()
          .values(
            output.workspaces.map((workspace) => ({
              workspace_id: workspace.id,
              name: workspace.name,
              account_id: output.account.id,
              avatar: workspace.avatar,
              role: workspace.user.role,
              description: workspace.description,
              user_id: workspace.user.id,
            }))
          )
          .execute();

        return { createdAccount, createdWorkspaces };
      });

    if (!createdAccount) {
      throw new MutationError(
        MutationErrorCode.AccountLoginFailed,
        'Failed to login with email and password! Please try again.'
      );
    }

    const account = mapAccount(createdAccount);
    eventBus.publish({
      type: 'account_created',
      account,
    });

    if (createdWorkspaces.length > 0) {
      for (const workspace of createdWorkspaces) {
        eventBus.publish({
          type: 'workspace_created',
          workspace: mapWorkspace(workspace),
        });
      }
    }
  }

  public async syncAccount(accountId: string) {
    this.debug(`Syncing account ${accountId}`);

    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', accountId)
      .executeTakeFirst();

    if (!account) {
      this.debug(`Account ${accountId} not found`);
      return;
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      this.debug(
        `Server ${account.server} not found for syncing account ${account.email}`
      );
      return;
    }

    if (!serverService.isAvailable(server.domain)) {
      this.debug(
        `Server ${server.domain} is not available for syncing account ${account.email}`
      );
      return;
    }

    const { data, status } = await httpClient.get<AccountSyncOutput>(
      '/v1/accounts/sync',
      {
        domain: server.domain,
        token: account.token,
      }
    );

    this.debug(`Account sync response status code: ${status}`);

    if (status >= 400 && status < 500) {
      this.debug(`Account ${account.email} is not valid, logging out...`);
      await this.logoutAccount(account);
      return;
    }

    if (status !== 200) {
      return;
    }

    const currentWorkspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', account.id)
      .execute();

    if (
      data.account.name !== account.name ||
      data.account.avatar !== account.avatar
    ) {
      const updatedAccount = await databaseService.appDatabase
        .updateTable('accounts')
        .returningAll()
        .set({
          name: data.account.name,
          avatar: data.account.avatar,
        })
        .where('id', '=', account.id)
        .executeTakeFirst();

      if (!updatedAccount) {
        this.debug(`Failed to update account ${account.email} after sync`);
        return;
      } else {
        this.debug(`Updated account ${account.email} after sync`);
      }

      eventBus.publish({
        type: 'account_updated',
        account: mapAccount(updatedAccount),
      });
    }

    for (const workspace of data.workspaces) {
      const currentWorkspace = currentWorkspaces.find(
        (w) => w.workspace_id === workspace.id
      );

      if (!currentWorkspace) {
        // create workspace here
        const createdWorkspace = await databaseService.appDatabase
          .insertInto('workspaces')
          .values({
            workspace_id: workspace.id,
            user_id: workspace.user.id,
            account_id: account.id,
            name: workspace.name,
            avatar: workspace.avatar,
            description: workspace.description,
            role: workspace.user.role,
          })
          .returningAll()
          .executeTakeFirst();

        if (!createdWorkspace) {
          this.debug(
            `Failed to create workspace ${workspace.id} for account ${account.email}`
          );
          return;
        } else {
          this.debug(
            `Created workspace ${workspace.id} for account ${account.email} after sync`
          );
        }

        eventBus.publish({
          type: 'workspace_created',
          workspace: mapWorkspace(createdWorkspace),
        });
      } else {
        // update workspace here
        const updatedWorkspace = await databaseService.appDatabase
          .updateTable('workspaces')
          .returningAll()
          .set({
            name: workspace.name,
            avatar: workspace.avatar,
            description: workspace.description,
            role: workspace.user.role,
          })
          .where('user_id', '=', currentWorkspace.user_id)
          .executeTakeFirst();

        if (!updatedWorkspace) {
          this.debug(
            `Failed to update workspace ${currentWorkspace.user_id} for account ${account.email}`
          );
          return;
        } else {
          this.debug(
            `Updated workspace ${currentWorkspace.user_id} for account ${account.email} after sync`
          );
        }

        eventBus.publish({
          type: 'workspace_updated',
          workspace: mapWorkspace(updatedWorkspace),
        });
      }
    }

    for (const workspace of currentWorkspaces) {
      const updatedWorkspace = data.workspaces.find(
        (w) => w.id === workspace.workspace_id
      );

      if (!updatedWorkspace) {
        await this.deleteWorkspace(workspace.user_id);
      }
    }
  }

  public async logoutAccount(account: SelectAccount): Promise<boolean> {
    this.debug(`Logging out account ${account.email}`);

    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .where('account_id', '=', account.id)
      .execute();

    for (const workspace of workspaces) {
      await this.deleteWorkspace(workspace.user_id);
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
      this.debug(`Failed to delete account ${account.email}`);
      return false;
    } else {
      this.debug(`Deleted account ${account.email}`);
    }

    eventBus.publish({
      type: 'account_deleted',
      account: mapAccount(deletedAccount),
    });

    await databaseService.appDatabase
      .insertInto('deleted_tokens')
      .values({
        token: account.token,
        account_id: account.id,
        server: account.server,
        created_at: new Date().toISOString(),
      })
      .execute();

    socketService.removeConnection(account.id);

    return true;
  }

  private async deleteWorkspace(userId: string): Promise<boolean> {
    this.debug(`Deleting workspace ${userId}`);

    const deletedWorkspace = await databaseService.appDatabase
      .deleteFrom('workspaces')
      .returningAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!deletedWorkspace) {
      this.debug(`Failed to delete workspace ${userId}`);
      return false;
    } else {
      this.debug(`Deleted workspace ${userId}`);
    }

    await databaseService.deleteWorkspaceDatabase(userId);
    const workspaceDir = getWorkspaceDirectoryPath(userId);
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true });
    }
    this.debug(`Deleted workspace directory ${workspaceDir}`);

    eventBus.publish({
      type: 'workspace_deleted',
      workspace: mapWorkspace(deletedWorkspace),
    });

    return true;
  }
}

export const accountService = new AccountService();
