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
import { LocalMutation, ServerMutation } from '@/types/mutations';
import { eventBus } from '@/lib/event-bus';
import { MutationManager } from '@/data/mutation-manager';

export class WorkspaceManager {
  private readonly account: Account;
  private readonly workspace: Workspace;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly subscribers: Map<string, SubscribedQueryData<unknown>>;
  private readonly mutationManager: MutationManager;

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

    this.mutationManager = new MutationManager(
      account,
      workspace,
      this.database,
    );

    this.mutationManager.onMutation(async (affectedTables) => {
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
    });
  }

  public async init() {
    await this.migrate();
  }

  public async executeQuery<T>(
    query: CompiledQuery<T>,
  ): Promise<QueryResult<T>> {
    const result = await this.database.executeQuery(query);

    //only transactions should have side effects
    if (result.numAffectedRows > 0) {
      throw new Error('Query should not have any side effects');
    }

    return result;
  }

  public async executeQueryAndSubscribe<T>(
    queryId: string,
    query: CompiledQuery<T>,
  ): Promise<QueryResult<T>> {
    const result = await this.database.executeQuery(query);

    // only transactions should have side effects
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

  public unsubscribeQuery(queryId: string) {
    this.subscribers.delete(queryId);
  }

  public async executeLocalMutation(mutation: LocalMutation) {
    await this.mutationManager.executeLocalMutation(mutation);
  }

  public async executeServerMutation(mutation: ServerMutation) {
    await this.mutationManager.executeServerMutation(mutation);
  }

  public async sendMutations() {
    await this.mutationManager.sendMutations();
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
