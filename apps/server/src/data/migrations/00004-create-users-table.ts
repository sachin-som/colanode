import { Migration, sql } from 'kysely';

export const createUsersTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS users_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('users')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('account_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('users_revision_sequence')`)
      )
      .addColumn('email', 'varchar(256)', (col) => col.notNull())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('avatar', 'varchar(256)')
      .addColumn('custom_name', 'varchar(256)')
      .addColumn('custom_avatar', 'varchar(256)')
      .addColumn('role', 'varchar(30)', (col) => col.notNull())
      .addColumn('storage_limit', 'bigint', (col) => col.notNull())
      .addColumn('max_file_size', 'bigint', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addUniqueConstraint('unique_workspace_account_combination', [
        'workspace_id',
        'account_id',
      ])
      .execute();

    await db.schema
      .createIndex('users_workspace_id_revision_idx')
      .on('users')
      .columns(['workspace_id', 'revision'])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_user_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('users_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_user_revision
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_user_revision();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_user_revision ON users;
      DROP FUNCTION IF EXISTS update_user_revision();
    `.execute(db);

    await db.schema.dropIndex('users_workspace_id_revision_idx').execute();
    await db.schema.dropTable('users').execute();
    await sql`DROP SEQUENCE IF EXISTS users_revision_sequence`.execute(db);
  },
};
