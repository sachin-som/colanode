import { Migration } from 'kysely';

export const createAccountsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('accounts')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('device_id', 'text', (col) => col.notNull())
      .addColumn('server', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('email', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text')
      .addColumn('token', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('accounts').execute();
  },
};
