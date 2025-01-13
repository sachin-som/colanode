import {
  DeleteResult,
  InsertResult,
  Kysely,
  Migration,
  Migrator,
  PostgresDialect,
  UpdateResult,
} from 'kysely';
import pg from 'pg';

import { databaseMigrations } from '@/data/migrations';
import { DatabaseSchema } from '@/data/schema';
import { configuration } from '@/lib/configuration';
import { createLogger } from '@/lib/logger';

const logger = createLogger('database');

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: configuration.postgres.url,
    ssl:
      configuration.postgres.ssl &&
      Object.values(configuration.postgres.ssl).some((value) => value)
        ? configuration.postgres.ssl
        : undefined,
  }),
});

export const database = new Kysely<DatabaseSchema>({
  dialect,
});

export const migrate = async () => {
  const migrator = new Migrator({
    db: database,
    provider: {
      getMigrations(): Promise<Record<string, Migration>> {
        return Promise.resolve(databaseMigrations);
      },
    },
  });

  const result = await migrator.migrateToLatest();
  if (result.error) {
    logger.error(`Migration failed, ${result.error}`);
  }

  if (result.results && result.results.length > 0) {
    for (const r of result.results) {
      logger.info(
        `Migration result: ${r.direction} - ${r.migrationName} - ${r.status} `
      );
    }
  }
};

export const hasInsertChanges = (result: InsertResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some(
    (r) => r.numInsertedOrUpdatedRows && r.numInsertedOrUpdatedRows > 0n
  );
};

export const hasUpdateChanges = (result: UpdateResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some((r) => r.numUpdatedRows && r.numUpdatedRows > 0n);
};

export const hasDeleteChanges = (result: DeleteResult[]): boolean => {
  return result.some((r) => r.numDeletedRows && r.numDeletedRows > 0n);
};
