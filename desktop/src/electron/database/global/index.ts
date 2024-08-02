import { app } from 'electron';
import SQLite from 'better-sqlite3';
import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import { GlobalDatabaseSchema } from '@/electron/database/global/schema';
import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { AccountTransactions, Transaction } from '@/types/transactions';
import { globalDatabaseMigrations } from '@/electron/database/global/migrations';
import { GlobalDatabaseData, WorkspaceDatabaseData } from '@/types/global';
import { WorkspaceDatabase } from '@/electron/database/workspace';

export class GlobalDatabase {
  database: Kysely<GlobalDatabaseSchema>;
  workspaceDatabases: Map<string, WorkspaceDatabase> = new Map();

  constructor() {
    const appPath = app.getPath('userData');
    const dialect = new SqliteDialect({
      database: new SQLite(`${appPath}/global.db`),
    });

    this.database = new Kysely<GlobalDatabaseSchema>({
      dialect,
    });
  }

  init = async (): Promise<GlobalDatabaseData> => {
    await this.migrate();

    const accounts = await this.getAccounts();
    const workspaces = await this.getWorkspaces();
    const workspaceDatabaseData: WorkspaceDatabaseData[] = [];

    for (const workspace of workspaces) {
      const data = await this.initWorkspaceDatabase(workspace);
      workspaceDatabaseData.push(data);
    }

    return {
      accounts,
      workspaces: workspaceDatabaseData,
    };
  };

  migrate = async () => {
    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(globalDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  };

  getWorkspaceDatabase = (
    accountId: string,
    workspaceId: string,
  ): WorkspaceDatabase => {
    const key = `${accountId}_${workspaceId}`;
    const workspaceDatabase = this.workspaceDatabases.get(key);
    if (!workspaceDatabase) {
      throw new Error(
        `Workspace database not found for workspace ID: ${workspaceId}`,
      );
    }

    return workspaceDatabase;
  };

  initWorkspaceDatabase = async (
    workspace: Workspace,
  ): Promise<WorkspaceDatabaseData> => {
    const key = `${workspace.accountId}_${workspace.id}`;
    const workspaceDatabase = new WorkspaceDatabase(
      workspace.accountId,
      workspace.id,
      this,
    );
    await workspaceDatabase.migrate();
    this.workspaceDatabases.set(key, workspaceDatabase);

    const nodes = await workspaceDatabase.getNodes();
    return {
      workspace,
      nodes,
    };
  };

  getAccounts = async (): Promise<Account[]> => {
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
    }));
  };

  addAccount = async (account: Account) => {
    await this.database.insertInto('accounts').values(account).execute();
  };

  getWorkspaces = async (): Promise<Workspace[]> => {
    const workspaces = await this.database
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    return workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      versionId: workspace.version_id,
      accountId: workspace.account_id,
      role: workspace.role,
      userNodeId: workspace.user_node_id,
    }));
  };

  addWorkspace = async (workspace: Workspace) => {
    await this.database
      .insertInto('workspaces')
      .values({
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
        version_id: workspace.versionId,
        account_id: workspace.accountId,
        role: workspace.role,
        user_node_id: workspace.userNodeId,
      })
      .execute();

    await this.initWorkspaceDatabase(workspace);
  };

  addTransaction = async (transaction: Transaction) => {
    await this.database
      .insertInto('transactions')
      .values({
        id: transaction.id,
        type: transaction.type,
        account_id: transaction.accountId,
        input: transaction.input,
        node_id: transaction.nodeId,
        created_at: transaction.createdAt.toISOString(),
        workspace_id: transaction.workspaceId,
      })
      .execute();
  };

  getGroupedAccountTransactions = async (
    count: number,
  ): Promise<AccountTransactions[]> => {
    const transactions = await this.database
      .selectFrom('transactions')
      .selectAll()
      .limit(count)
      .execute();

    if (transactions.length === 0) {
      return [];
    }

    const accountIds = transactions.map(
      (transaction) => transaction.account_id,
    );
    const accounts = await this.database
      .selectFrom('accounts')
      .selectAll()
      .where('id', 'in', accountIds)
      .execute();

    const transactionsMap = new Map<string, Transaction[]>();
    transactions.forEach((transaction) => {
      const input = JSON.parse(transaction.input);
      const transactionObj = {
        id: transaction.id,
        workspaceId: transaction.workspace_id,
        accountId: transaction.account_id,
        type: transaction.type,
        nodeId: transaction.node_id,
        input: input,
        createdAt: new Date(transaction.created_at),
      };

      if (transactionsMap.has(transaction.account_id)) {
        transactionsMap.get(transaction.account_id)?.push(transactionObj);
      } else {
        transactionsMap.set(transaction.account_id, [transactionObj]);
      }
    });

    return accounts.map((account) => ({
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        token: account.token,
      },
      transactions: transactionsMap.get(account.id) || [],
    }));
  };

  deleteTransactions = async (ids: string[]) => {
    await this.database
      .deleteFrom('transactions')
      .where('id', 'in', ids)
      .execute();
  };
}

export const globalDatabase = new GlobalDatabase();
