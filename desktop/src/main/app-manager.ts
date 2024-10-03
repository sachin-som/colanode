// import { app } from 'electron';
// import {
//   CompiledQuery,
//   Kysely,
//   Migration,
//   Migrator,
//   QueryResult,
//   SqliteDialect,
// } from 'kysely';
// import { AccountManager } from '@/main/account-manager';
// import { AppDatabaseSchema } from '@/main/schemas/app';
// import { appDatabaseMigrations } from '@/main/migrations/app';
// import { Account } from '@/types/accounts';
// import {
//   buildSqlite,
//   extractTablesFromSql,
//   resultHasChanged,
// } from '@/main/utils';
// import { Workspace, WorkspaceRole } from '@/types/workspaces';
// import { SubscribedQueryContext, SubscribedQueryResult } from '@/types/queries';
// import { eventBus } from '@/lib/event-bus';
// import { isEqual } from 'lodash';
// import { Server } from '@/types/servers';

// const EVENT_LOOP_INTERVAL = 1000;

// class AppManager {
//   private readonly servers: Map<string, Server>;
//   private readonly accounts: Map<string, AccountManager>;
//   private readonly appPath: string;
//   private readonly database: Kysely<AppDatabaseSchema>;
//   private readonly subscribers: Map<string, SubscribedQueryResult<unknown>>;
//   private initPromise: Promise<void> | null = null;

//   constructor() {
//     this.servers = new Map<string, Server>();
//     this.accounts = new Map<string, AccountManager>();
//     this.appPath = app.getPath('userData');
//     this.subscribers = new Map();

//     const dialect = new SqliteDialect({
//       database: buildSqlite(`${this.appPath}/app.db`),
//     });

//     this.database = new Kysely<AppDatabaseSchema>({
//       dialect,
//     });

//     this.executeEventLoop = this.executeEventLoop.bind(this);
//   }

//   public async getAccount(
//     accountId: string,
//   ): Promise<AccountManager | undefined> {
//     await this.waitForInit();
//     return this.accounts.get(accountId);
//   }

//   public async init(): Promise<void> {
//     if (!this.initPromise) {
//       this.initPromise = this.executeInit();
//     }

//     await this.initPromise;
//   }

//   public async executeQuery<T>(
//     query: CompiledQuery<T>,
//   ): Promise<QueryResult<T>> {
//     await this.waitForInit();
//     const result = await this.database.executeQuery(query);

//     //only mutations should have side effects
//     if (result.numAffectedRows > 0) {
//       throw new Error('Query should not have any side effects');
//     }

//     return result;
//   }

//   public async executeQueryAndSubscribe<T>(
//     context: SubscribedQueryContext<T>,
//   ): Promise<QueryResult<T>> {
//     await this.waitForInit();
//     const result = await this.database.executeQuery(context.query);

//     // only mutations should have side effects
//     if (result.numAffectedRows > 0) {
//       throw new Error('Query should not have any side effects');
//     }

//     const queryId = context.key.join('|') + context.page;
//     const selectedTables = extractTablesFromSql(context.query.sql);
//     const subscriberData: SubscribedQueryResult<T> = {
//       context,
//       tables: selectedTables,
//       result: result,
//     };
//     this.subscribers.set(queryId, subscriberData);

//     return result;
//   }

//   public async executeMutation(
//     mutation: CompiledQuery | CompiledQuery[],
//   ): Promise<void> {
//     const affectedTables = new Set<string>();
//     let numAffectedRows = 0n;

//     if (Array.isArray(mutation)) {
//       // Execute multiple queries as a transaction
//       await this.database.transaction().execute(async (trx) => {
//         for (const query of mutation) {
//           const result = await trx.executeQuery(query);
//           if (result.numAffectedRows > 0n) {
//             numAffectedRows += result.numAffectedRows;
//             extractTablesFromSql(query.sql).forEach((table) =>
//               affectedTables.add(table),
//             );
//           }
//         }
//       });
//     } else {
//       // Execute single query
//       const result = await this.database.executeQuery(mutation);
//       numAffectedRows = result.numAffectedRows;
//       if (numAffectedRows > 0n) {
//         extractTablesFromSql(mutation.sql).forEach((table) =>
//           affectedTables.add(table),
//         );
//       }
//     }

//     if (numAffectedRows === 0n) {
//       return;
//     }

//     if (affectedTables.size === 0) {
//       return;
//     }

//     if (affectedTables.has('servers')) {
//       const servers = await this.getServers();
//       for (const server of servers) {
//         this.servers.set(server.domain, server);
//       }
//     }

//     if (affectedTables.has('accounts')) {
//       const accounts = await this.getAccounts();
//       for (const account of accounts) {
//         if (this.accounts.has(account.id)) {
//           continue;
//         }

//         const server = this.servers.get(account.server);
//         if (!server) {
//           continue;
//         }

//         const accountManager = new AccountManager(
//           server,
//           account,
//           this.appPath,
//           [],
//           this.database,
//         );

//         await accountManager.init();
//         this.accounts.set(account.id, accountManager);
//       }
//     }

//     if (affectedTables.has('workspaces')) {
//       const workspaces = await this.getWorkspaces();
//       for (const workspace of workspaces) {
//         const accountManager = this.accounts.get(workspace.accountId);
//         if (!accountManager) {
//           continue;
//         }

//         const workspaceManager = accountManager.getWorkspace(workspace.id);
//         if (!workspaceManager) {
//           await accountManager.addWorkspace(workspace);
//         }
//       }
//     }

//     for (const subscriber of this.subscribers.values()) {
//       const hasAffectedTables = subscriber.tables.some((table) =>
//         affectedTables.has(table),
//       );

//       if (!hasAffectedTables) {
//         continue;
//       }

//       const newResult = await this.database.executeQuery(
//         subscriber.context.query,
//       );

//       if (resultHasChanged(subscriber.result, newResult)) {
//         subscriber.result = newResult;
//         eventBus.publish({
//           event: 'app_query_updated',
//           payload: {
//             key: subscriber.context.key,
//             page: subscriber.context.page,
//             result: newResult,
//           },
//         });
//       }
//     }
//   }

//   public unsubscribeQuery(queryKey: string[]): void {
//     var queryIds = [...this.subscribers.keys()];
//     for (const queryId of queryIds) {
//       const subscriberData = this.subscribers.get(queryId);
//       if (isEqual(subscriberData.context.key, queryKey)) {
//         this.subscribers.delete(queryId);
//       }
//     }
//   }

//   public async logout(accountId: string): Promise<void> {
//     await this.waitForInit();
//     const accountManager = this.accounts.get(accountId);
//     if (!accountManager) {
//       throw new Error(`Account not found: ${accountId}`);
//     }

//     accountManager.account.status = 'logout';
//     const markAccountLoggedOutQuery = this.database
//       .updateTable('accounts')
//       .set({
//         status: 'logout',
//       })
//       .where('id', '=', accountId)
//       .compile();

//     await this.executeMutation(markAccountLoggedOutQuery);
//   }

//   private async waitForInit(): Promise<void> {
//     if (!this.initPromise) {
//       this.initPromise = this.executeInit();
//     }

//     await this.initPromise;
//   }

//   private async executeInit(): Promise<void> {
//     await this.migrate();

//     const servers = await this.getServers();
//     for (const server of servers) {
//       this.servers.set(server.domain, server);
//     }

//     const accounts = await this.getAccounts();
//     const workspaces = await this.getWorkspaces();
//     for (const account of accounts) {
//       const accountWorkspaces = workspaces.filter(
//         (workspace) => workspace.accountId === account.id,
//       );

//       const server = this.servers.get(account.server);
//       if (!server) {
//         continue;
//       }

//       const accountManager = new AccountManager(
//         server,
//         account,
//         this.appPath,
//         accountWorkspaces,
//         this.database,
//       );
//       await accountManager.init();

//       this.accounts.set(account.id, accountManager);
//     }

//     setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
//   }

//   private async executeEventLoop(): Promise<void> {
//     try {
//       for (const accountManager of this.accounts.values()) {
//         if (accountManager.account.status === 'logout') {
//           const loggedOut = await accountManager.logout();
//           if (loggedOut) {
//             await this.database
//               .deleteFrom('accounts')
//               .where('id', '=', accountManager.account.id)
//               .execute();

//             this.accounts.delete(accountManager.account.id);
//           }
//         } else {
//           await accountManager.executeEventLoop();
//         }
//       }
//     } catch (error) {
//       // console.error('Error in event loop:', error);
//     }
//     setTimeout(this.executeEventLoop, EVENT_LOOP_INTERVAL);
//   }

//   private async migrate(): Promise<void> {
//     const migrator = new Migrator({
//       db: this.database,
//       provider: {
//         getMigrations(): Promise<Record<string, Migration>> {
//           return Promise.resolve(appDatabaseMigrations);
//         },
//       },
//     });

//     await migrator.migrateToLatest();
//   }

//   private async getServers(): Promise<Server[]> {
//     const servers = await this.database
//       .selectFrom('servers')
//       .selectAll()
//       .execute();

//     return servers.map((server) => ({
//       domain: server.domain,
//       name: server.name,
//       avatar: server.avatar,
//       attributes: JSON.parse(server.attributes),
//       version: server.version,
//       createdAt: new Date(server.created_at),
//       lastSyncedAt: server.last_synced_at
//         ? new Date(server.last_synced_at)
//         : null,
//     }));
//   }

//   private async getAccounts(): Promise<Account[]> {
//     const accounts = await this.database
//       .selectFrom('accounts')
//       .selectAll()
//       .execute();

//     return accounts.map((account) => ({
//       id: account.id,
//       name: account.name,
//       email: account.email,
//       avatar: account.avatar,
//       token: account.token,
//       deviceId: account.device_id,
//       server: account.server,
//       status: account.status,
//     }));
//   }

//   private async getWorkspaces(): Promise<Workspace[]> {
//     const workspaces = await this.database
//       .selectFrom('workspaces')
//       .selectAll()
//       .execute();

//     return workspaces.map(
//       (workspace): Workspace => ({
//         id: workspace.id,
//         accountId: workspace.account_id,
//         name: workspace.name,
//         description: workspace.description,
//         avatar: workspace.avatar,
//         versionId: workspace.version_id,
//         role: workspace.role as WorkspaceRole,
//         userId: workspace.user_id,
//         synced: workspace.synced === 1,
//       }),
//     );
//   }
// }

// export const appManager = new AppManager();
