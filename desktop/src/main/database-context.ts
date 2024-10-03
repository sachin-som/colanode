import { app } from 'electron';
import * as fs from 'node:fs';
import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import { AppDatabaseSchema, SelectWorkspace } from '@/main/schemas/app';
import { WorkspaceDatabaseSchema } from '@/main/schemas/workspace';
import { buildSqlite } from '@/main/utils';
import { appDatabaseMigrations } from '@/main/migrations/app';
import { workspaceDatabaseMigrations } from '@/main/migrations/workspace';

class DatabaseContext {
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

    await this.initWorkspaceDatabase(workspace);
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
      await this.initWorkspaceDatabase(workspace);
    }
  }

  private async initWorkspaceDatabase(
    workspace: SelectWorkspace,
  ): Promise<void> {
    const workspaceDir = `${this.appPath}/${workspace.user_id}`;
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
    this.workspaceDatabases.set(workspace.user_id, workspaceDatabase);
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

export const databaseContext = new DatabaseContext();
