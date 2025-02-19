import { sql, Migration } from 'kysely';

export const createNodeUpdatesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS node_updates_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('node_updates')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('node_updates_revision_sequence')`)
      )
      .addColumn('data', 'bytea', (col) => col.notNull())
      .addColumn('merged_updates', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_node_update_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('node_updates_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_node_update_revision
      BEFORE UPDATE ON node_updates
      FOR EACH ROW
      EXECUTE FUNCTION update_node_update_revision();
    `.execute(db);

    await db.schema
      .createIndex('node_updates_root_id_revision_idx')
      .on('node_updates')
      .columns(['root_id', 'revision'])
      .execute();

    await db.schema
      .createIndex('node_updates_node_id_idx')
      .on('node_updates')
      .columns(['node_id'])
      .execute();
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_node_update_revision ON node_updates;
      DROP FUNCTION IF EXISTS update_document_update_revision();
    `.execute(db);

    await db.schema.dropTable('node_updates').execute();
    await sql`DROP SEQUENCE IF EXISTS node_updates_revision_sequence`.execute(
      db
    );
  },
};
