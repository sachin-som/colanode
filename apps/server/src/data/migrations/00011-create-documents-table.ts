import { Migration, sql } from 'kysely';

export const createDocumentsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('documents')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('type', 'varchar(30)', (col) =>
        col.generatedAlwaysAs(sql`(content->>'type')::VARCHAR(30)`).stored()
      )
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) => col.notNull())
      .addColumn('content', 'jsonb', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('documents').execute();
  },
};
