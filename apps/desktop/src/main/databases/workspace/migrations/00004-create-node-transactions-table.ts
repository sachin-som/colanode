import { Migration } from 'kysely';

export const createNodeTransactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_transactions')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('operation', 'integer', (col) => col.notNull())
      .addColumn('data', 'blob', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_transactions').execute();
  },
};
