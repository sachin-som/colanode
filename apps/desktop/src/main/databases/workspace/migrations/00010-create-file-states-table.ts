import { Migration } from 'kysely';

export const createFileStatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('file_states')
      .addColumn('file_id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('download_status', 'integer', (col) => col.notNull())
      .addColumn('download_progress', 'integer', (col) => col.notNull())
      .addColumn('download_retries', 'integer', (col) => col.notNull())
      .addColumn('upload_status', 'integer', (col) => col.notNull())
      .addColumn('upload_progress', 'integer', (col) => col.notNull())
      .addColumn('upload_retries', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('file_states').execute();
  },
};
