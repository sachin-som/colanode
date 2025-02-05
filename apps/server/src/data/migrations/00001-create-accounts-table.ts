import { Migration } from 'kysely';

export const createAccountsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('accounts')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('email', 'varchar(256)', (col) => col.notNull().unique())
      .addColumn('avatar', 'varchar(256)')
      .addColumn('password', 'varchar(256)')
      .addColumn('attrs', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('status', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('accounts').execute();
  },
};
