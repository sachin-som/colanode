import { app } from 'electron';
import {
  CompiledQuery,
  Kysely,
  Migration,
  Migrator,
  QueryResult,
  SqliteDialect,
} from 'kysely';
import { AccountManager } from '@/data/account-manager';
import { AppDatabaseSchema } from '@/data/schemas/app';
import { appDatabaseMigrations } from '@/data/migrations/app';
import { Account } from '@/types/accounts';
import { buildSqlite } from '@/data/utils';
import { Workspace } from '@/types/workspaces';

class AppManager {
  private readonly accounts: Map<string, AccountManager>;
  private readonly appPath: string;
  private readonly database: Kysely<AppDatabaseSchema>;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.accounts = new Map<string, AccountManager>();
    this.appPath = app.getPath('userData');

    const dialect = new SqliteDialect({
      database: buildSqlite(`${this.appPath}/global.db`),
    });

    this.database = new Kysely<AppDatabaseSchema>({
      dialect,
    });
  }

  public async getAccount(
    accountId: string,
  ): Promise<AccountManager | undefined> {
    await this.waitForInit();
    return this.accounts.get(accountId);
  }

  public async init() {
    if (!this.initPromise) {
      this.initPromise = this.startInit();
    }

    await this.initPromise;
  }

  public async execute(
    query: CompiledQuery<unknown>,
  ): Promise<QueryResult<unknown>> {
    await this.waitForInit();
    return await this.database.executeQuery(query);
  }

  public async logout(accountId: string): Promise<void> {
    await this.waitForInit();
    const accountManager = this.accounts.get(accountId);
    if (!accountManager) {
      throw new Error(`Account not found: ${accountId}`);
    }

    await accountManager.logout();
    this.accounts.delete(accountId);
  }

  private async waitForInit() {
    if (!this.initPromise) {
      this.initPromise = this.startInit();
    }

    await this.initPromise;
  }

  private async startInit() {
    await this.migrate();

    const accounts = await this.getAccounts();
    const workspaces = await this.getWorkspaces();
    for (const account of accounts) {
      const accountWorkspaces = workspaces.filter(
        (workspace) => workspace.accountId === account.id,
      );
      const accountManager = new AccountManager(
        account,
        this.appPath,
        accountWorkspaces,
      );
      await accountManager.init();

      this.accounts.set(account.id, accountManager);
    }
  }

  private async migrate() {
    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(appDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }

  private async getAccounts(): Promise<Account[]> {
    const accounts = await this.database
      .selectFrom('accounts')
      .selectAll()
      .execute();

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      token: account.token,
      deviceId: account.device_id,
    }));
  }

  private async getWorkspaces(): Promise<Workspace[]> {
    const workspaces = await this.database
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    return workspaces.map((workspace) => ({
      id: workspace.id,
      accountId: workspace.account_id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      versionId: workspace.version_id,
      role: workspace.role,
      userId: workspace.user_id,
      syncedAt: workspace.synced_at ? new Date(workspace.synced_at) : null,
    }));
  }
}

export const appManager = new AppManager();
