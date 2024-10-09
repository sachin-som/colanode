import { app } from 'electron';
import path from 'path';
import fs from 'fs';
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

    const workspaceDatabase = await this.initWorkspaceDatabase(
      workspace.account_id,
      workspace.workspace_id,
    );

    this.workspaceDatabases.set(userId, workspaceDatabase);
    return workspaceDatabase;
  }

  public async deleteWorkspaceDatabase(
    accountId: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    await this.waitForInit();

    if (this.workspaceDatabases.has(userId)) {
      this.workspaceDatabases.delete(userId);
    }

    const workspaceDir = path.join(
      this.appPath,
      accountId,
      'workspaces',
      workspaceId,
    );

    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
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
      const workspaceDatabase = await this.initWorkspaceDatabase(
        workspace.account_id,
        workspace.workspace_id,
      );

      this.workspaceDatabases.set(workspace.user_id, workspaceDatabase);
    }
  }

  private async initWorkspaceDatabase(
    accountId: string,
    workspaceId: string,
  ): Promise<Kysely<WorkspaceDatabaseSchema>> {
    const workspaceDir = path.join(
      this.appPath,
      accountId,
      'workspaces',
      workspaceId,
    );

    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, {
        recursive: true,
      });
    }

    const dialect = new SqliteDialect({
      database: buildSqlite(`${workspaceDir}/workspace.db`),
    });

    const workspaceDatabase = new Kysely<WorkspaceDatabaseSchema>({
      dialect,
    });

    await this.migrateWorkspaceDatabase(workspaceDatabase);
    return workspaceDatabase;
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
