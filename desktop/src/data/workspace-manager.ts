import * as fs from 'node:fs';
import {
  CompiledQuery,
  Kysely,
  Migration,
  Migrator,
  QueryResult,
  SqliteDialect,
} from 'kysely';
import { Workspace } from '@/types/workspaces';
import { WorkspaceDatabaseSchema } from '@/data/schemas/workspace';
import { workspaceDatabaseMigrations } from '@/data/migrations/workspace';
import { Account } from '@/types/accounts';
import {
  buildSqlite,
  extractTablesFromSql,
  resultHasChanged,
} from '@/data/utils';
import { SubscribedQueryData } from '@/types/databases';
import {
  Transaction,
  TransactionAction,
  TransactionTable,
} from '@/types/transactions';
import { eventBus } from '@/lib/event-bus';

export class WorkspaceManager {
  private readonly account: Account;
  private readonly workspace: Workspace;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly subscribers: Map<string, SubscribedQueryData<unknown>>;

  private lastChangeAt: Date = new Date();

  constructor(account: Account, workspace: Workspace, accountPath: string) {
    this.account = account;
    this.workspace = workspace;
    this.subscribers = new Map();

    const workspaceDir = `${accountPath}/${workspace.id}`;
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir);
    }

    const dialect = new SqliteDialect({
      database: buildSqlite(`${workspaceDir}/workspace.db`),
    });

    this.database = new Kysely<WorkspaceDatabaseSchema>({
      dialect,
    });
  }

  public async init() {
    await this.migrate();
  }

  public async execute<T>(query: CompiledQuery<T>): Promise<QueryResult<T>> {
    const result = await this.database.executeQuery(query);

    if (result.numAffectedRows > 0) {
      this.lastChangeAt = new Date();
      const affectedTables = extractTablesFromSql(query.sql);

      for (const [subscriberId, subscriberData] of this.subscribers) {
        const hasAffectedTables = subscriberData.tables.some((table) =>
          affectedTables.includes(table),
        );

        if (!hasAffectedTables) {
          continue;
        }

        const newResult = await this.database.executeQuery(
          subscriberData.query,
        );

        if (resultHasChanged(subscriberData.result, newResult)) {
          eventBus.publish({
            event: 'workspace_query_updated',
            payload: {
              queryId: subscriberId,
              result: newResult,
            },
          });
        }
      }
    }

    return result;
  }

  public async executeAndSubscribe<T>(
    queryId: string,
    query: CompiledQuery<T>,
  ): Promise<QueryResult<T>> {
    const result = await this.database.executeQuery(query);
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

  public unsubscribe(subscriberId: string) {
    this.subscribers.delete(subscriberId);
  }

  public async getTransactions(): Promise<Transaction[]> {
    const transactions = await this.database
      .selectFrom('transactions')
      .selectAll()
      .execute();

    if (transactions.length === 0) {
      return [];
    }

    return transactions.map((row) => {
      return {
        id: row.id,
        workspaceId: this.workspace.id,
        action: row.action as TransactionAction,
        table: row.table as TransactionTable,
        after: row.after,
        before: row.before,
        createdAt: row.created_at,
      };
    });
  }

  public async acknowledgeTransaction(transactionId: string) {
    await this.database
      .deleteFrom('transactions')
      .where('id', '=', transactionId)
      .execute();
  }

  private async migrate() {
    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(workspaceDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }
}
