import { Migration } from 'kysely';

export const createDevicesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('devices')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('account_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('token_hash', 'varchar(100)', (col) => col.notNull())
      .addColumn('token_salt', 'varchar(100)', (col) => col.notNull())
      .addColumn('token_generated_at', 'timestamptz', (col) => col.notNull())
      .addColumn('previous_token_hash', 'varchar(100)')
      .addColumn('previous_token_salt', 'varchar(100)')
      .addColumn('type', 'integer', (col) => col.notNull())
      .addColumn('version', 'varchar(30)', (col) => col.notNull())
      .addColumn('platform', 'varchar(30)')
      .addColumn('ip', 'varchar(45)')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('synced_at', 'timestamptz')
      .execute();

    await db.schema
      .createIndex('devices_account_id_idx')
      .on('devices')
      .column('account_id')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropIndex('devices_account_id_idx').execute();
    await db.schema.dropTable('devices').execute();
  },
};
