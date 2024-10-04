import { app } from 'electron';
import * as fs from 'node:fs';
import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import { AppDatabaseSchema } from '@/main/data/app/schema';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { buildSqlite } from '@/main/data/utils';
import { appDatabaseMigrations } from '@/main/data/app/migrations';
import { workspaceDatabaseMigrations } from '@/main/data/workspace/migrations';

class DatabaseManager {
  private readonly appPath: string;
  private initPromise: Promise<void> | null = null;
  private readonly workspaceDatabases: Map<
    string,
    Kysely<WorkspaceDatabaseSchema>
  > = new Map();

  public readonly appDatabase: Kysely<AppDatabaseSchema>;

  constructor() {
    this.appPath = app.getPath('userData');

    const dialect = new SqliteDialect({
      database: buildSqlite(`${this.appPath}/app.db`),
    });

    this.appDatabase = new Kysely<AppDatabaseSchema>({ dialect });
  }

  public async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    await this.initPromise;
  }

  public async getWorkspaceDatabase(
    userId: string,
  ): Promise<Kysely<WorkspaceDatabaseSchema> | null> {
    this.waitForInit();

    if (this.workspaceDatabases.has(userId)) {
      return this.workspaceDatabases.get(userId);
    }

    //try and check if it's in database but hasn't been loaded yet
    const workspace = await this.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      return null;
    }

    await this.initWorkspaceDatabase(userId);
    if (this.workspaceDatabases.has(userId)) {
      return this.workspaceDatabases.get(userId);
    }

    return null;
  }

  private async waitForInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    await this.initPromise;
  }

  private async executeInit(): Promise<void> {
    await this.migrateAppDatabase();

    const workspaces = await this.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    for (const workspace of workspaces) {
      await this.initWorkspaceDatabase(workspace.user_id);
    }
  }

  private async initWorkspaceDatabase(userId: string): Promise<void> {
    const workspaceDir = `${this.appPath}/${userId}`;
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir);
    }

    const dialect = new SqliteDialect({
      database: buildSqlite(`${workspaceDir}/workspace.db`),
    });

    const workspaceDatabase = new Kysely<WorkspaceDatabaseSchema>({
      dialect,
    });

    await this.migrateWorkspaceDatabase(workspaceDatabase);
    this.workspaceDatabases.set(userId, workspaceDatabase);
  }

  private async migrateAppDatabase(): Promise<void> {
    const migrator = new Migrator({
      db: this.appDatabase,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(appDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }

  private async migrateWorkspaceDatabase(
    database: Kysely<WorkspaceDatabaseSchema>,
  ): Promise<void> {
    const migrator = new Migrator({
      db: database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(workspaceDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }
}

export const databaseManager = new DatabaseManager();
