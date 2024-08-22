import { Migration } from 'kysely';

const createAccountsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('accounts')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('device_id', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('email', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text')
      .addColumn('token', 'text', (col) => col.notNull())
      .addColumn('last_update_id', 'text')
      .addColumn('last_update_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('accounts').execute();
  },
};

const createWorkspacesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspaces')
      .addColumn('id', 'text', (col) => col.notNull())
      .addColumn('account_id', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('avatar', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('role', 'integer', (col) => col.notNull())
      .addColumn('user_id', 'text', (col) => col.notNull())
      .addColumn('synced_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspaces').execute();
  },
};

export const appDatabaseMigrations: Record<string, Migration> = {
  '202408011709_create_accounts_table': createAccountsTable,
  '202408011712_create_workspaces_table': createWorkspacesTable,
};
