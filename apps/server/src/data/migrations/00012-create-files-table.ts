import { sql, Migration } from 'kysely';

export const createFilesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS files_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('files')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('type', 'varchar(30)', (col) => col.notNull())
      .addColumn('parent_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('entry_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('original_name', 'varchar(256)', (col) => col.notNull())
      .addColumn('mime_type', 'varchar(256)', (col) => col.notNull())
      .addColumn('extension', 'varchar(256)', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('files_revision_sequence')`)
      )
      .execute();

    await db.schema
      .createIndex('files_root_id_revision_idx')
      .on('files')
      .columns(['root_id', 'revision'])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_file_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('files_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_file_revision
      BEFORE UPDATE ON files
      FOR EACH ROW
      EXECUTE FUNCTION update_file_revision();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_file_revision ON files;
      DROP FUNCTION IF EXISTS update_file_revision();
    `.execute(db);

    await db.schema.dropTable('files').execute();
    await sql`DROP SEQUENCE IF EXISTS files_revision_sequence`.execute(db);
  },
};
