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
import {
  buildSqlite,
  extractTablesFromSql,
  resultHasChanged,
} from '@/data/utils';
import { Workspace } from '@/types/workspaces';
import { SubscribedQueryData } from '@/types/databases';
import { eventBus } from '@/lib/event-bus';

const EVENT_LOOP_INTERVAL = 1000;

class AppManager {
  private readonly accounts: Map<string, AccountManager>;
  private readonly appPath: string;
  private readonly database: Kysely<AppDatabaseSchema>;
  private readonly subscribers: Map<string, SubscribedQueryData<unknown>>;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.accounts = new Map<string, AccountManager>();
    this.appPath = app.getPath('userData');
    this.subscribers = new Map();

    const dialect = new SqliteDialect({
      database: buildSqlite(`${this.appPath}/app.db`),
    });

    this.database = new Kysely<AppDatabaseSchema>({
      dialect,
    });

    this.executeEventLoop = this.executeEventLoop.bind(this);
  }

  public async getAccount(
    accountId: string,
  ): Promise<AccountManager | undefined> {
    await this.waitForInit();
    return this.accounts.get(accountId);
  }

  public async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    await this.initPromise;
  }

  public async executeQuery<T>(
    query: CompiledQuery<T>,
  ): Promise<QueryResult<T>> {
    await this.waitForInit();
    const result = await this.database.executeQuery(query);

    //only mutations should have side effects
    if (result.numAffectedRows > 0) {
      throw new Error('Query should not have any side effects');
    }

    return result;
  }

  public async executeQueryAndSubscribe<T>(
    queryId: string,
    query: CompiledQuery<T>,
  ): Promise<QueryResult<T>> {
    await this.waitForInit();
    const result = await this.database.executeQuery(query);

    // only mutations should have side effects
    if (result.numAffectedRows > 0) {
      throw new Error('Query should not have any side effects');
    }

    const selectedTables = extractTablesFromSql(query.sql);
    const subscriberData: SubscribedQueryData<T> = {
      query,
      tables: selectedTables,
      result: result,
    };
    this.subscribers.set(queryId, subscriberData);

    return result;
  }

  public async executeMutation(mutation: CompiledQuery): Promise<void> {
    const result = await this.database.executeQuery(mutation);
    if (result.numAffectedRows === 0n) {
      return;
    }

    const affectedTables = extractTablesFromSql(mutation.sql);
    if (affectedTables.length === 0) {
      return;
    }

    if (affectedTables.includes('accounts')) {
      const accounts = await this.getAccounts();
      for (const account of accounts) {
        if (this.accounts.has(account.id)) {
          continue;
        }

        const accountManager = new AccountManager(
          account,
          this.appPath,
          [],
          this.database,
        );

        await accountManager.init();
        this.accounts.set(account.id, accountManager);
      }
    }

    if (affectedTables.includes('workspaces')) {
      const workspaces = await this.getWorkspaces();
      for (const workspace of workspaces) {
        const accountManager = this.accounts.get(workspace.accountId);
        if (!accountManager) {
          continue;
        }

        const workspaceManager = accountManager.getWorkspace(workspace.id);
        if (!workspaceManager) {
          await accountManager.addWorkspace(workspace);
        }
      }
    }

    for (const [subscriberId, subscriberData] of this.subscribers) {
      const hasAffectedTables = subscriberData.tables.some((table) =>
        affectedTables.includes(table),
      );

      if (!hasAffectedTables) {
        continue;
      }

      const newResult = await this.database.executeQuery(subscriberData.query);

      if (resultHasChanged(subscriberData.result, newResult)) {
        eventBus.publish({
          event: 'app_query_updated',
          payload: {
            queryId: subscriberId,
            result: newResult,
          },
        });
      }
    }
  }

  public unsubscribeQuery(queryId: string): void {
    this.subscribers.delete(queryId);
  }

  public async logout(accountId: string): Promise<void> {
    await this.waitForInit();
    const accountManager = this.accounts.get(accountId);
    if (!accountManager) {
      throw new Error(`Account not found: ${accountId}`);
    }

    await accountManager.logout();
    this.accounts.delete(accountId);

    const deleteAccountQuery = this.database
      .deleteFrom('accounts')
      .where('id', '=', accountId)
      .compile();

    const deleteWorkspacesQuery = this.database
      .deleteFrom('workspaces')
      .where('account_id', '=', accountId)
      .compile();

    await this.executeMutation(deleteAccountQuery);
    await this.executeMutation(deleteWorkspacesQuery);
  }

  private async waitForInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    await this.initPromise;
  }

  private async executeInit(): Promise<void> {
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
        this.database,
      );
      await accountManager.init();

      this.accounts.set(account.id, accountManager);
    }

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async executeEventLoop(): Promise<void> {
    try {
      for (const accountManager of this.accounts.values()) {
        await accountManager.executeEventLoop();
      }
    } catch (error) {
      console.error('Error in event loop:', error);
    }

    setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
  }

  private async migrate(): Promise<void> {
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

    return workspaces.map(
      (workspace): Workspace => ({
        id: workspace.id,
        accountId: workspace.account_id,
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
        versionId: workspace.version_id,
        role: workspace.role,
        userId: workspace.user_id,
        synced: workspace.synced === 1,
      }),
    );
  }
}

export const appManager = new AppManager();
