import {app} from "electron";
import SQLite from "better-sqlite3";
import {Kysely, Migration, Migrator, SqliteDialect} from "kysely";
import { GlobalDatabaseSchema } from "@/electron/database/global/schema";
import {workspaceDatabaseMigrations} from "@/electron/database/workspace/migrations";
import * as fs from "node:fs";

class WorkspaceDatabase {
  database: Kysely<GlobalDatabaseSchema>;

  constructor(accountId: string, workspaceId: string) {
    const appPath = app.getPath('userData');
    const accountPath = `${appPath}/account_${accountId}`;
    if (!fs.existsSync(accountPath)) {
      fs.mkdirSync(accountPath);
    }

    const dialect = new SqliteDialect({
      database: new SQLite(`${accountPath}/workspace_${workspaceId}.db`),
    });

    this.database = new Kysely<GlobalDatabaseSchema>({
      dialect,
    });
  }

  migrate = async () => {
    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(workspaceDatabaseMigrations);
        }
      }
    })

    await migrator.migrateToLatest();
  }
}

const workspaceDatabasesMap = new Map<string, WorkspaceDatabase>();

export const getWorkspaceDatabase = async (accountId: string, workspaceId: string) => {
  const key = `${accountId}/${workspaceId}`;
  if (!workspaceDatabasesMap.has(key)) {
    const workspaceDatabase = new WorkspaceDatabase(accountId, workspaceId);
    await workspaceDatabase.migrate();
    workspaceDatabasesMap.set(key, workspaceDatabase);
  }

  return workspaceDatabasesMap.get(key)!;
}