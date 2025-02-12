import { Migration } from 'kysely';

export const createDocumentsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('documents')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('revision', 'integer', (col) => col.notNull())
      .addColumn('state', 'blob', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('updated_by', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('documents').execute();
  },
};
