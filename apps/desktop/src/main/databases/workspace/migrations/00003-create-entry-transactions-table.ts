import { Migration } from 'kysely';

export const createEntryTransactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('entry_transactions')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('entry_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('operation', 'integer', (col) => col.notNull())
      .addColumn('data', 'blob')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('entry_transactions').execute();
  },
};
