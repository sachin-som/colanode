import { Kysely, Migration, Migrator, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DatabaseSchema } from '@/data/schema';
import { databaseMigrations } from '@/data/migrations';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
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

  await migrator.migrateToLatest();
};
