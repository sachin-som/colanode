import { Migration, sql } from 'kysely';

export const createNodesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS nodes_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('nodes')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('type', 'varchar(30)', (col) =>
        col.generatedAlwaysAs(sql`(attributes->>'type')::VARCHAR(30)`).stored()
      )
      .addColumn('parent_id', 'varchar(30)', (col) =>
        col
          .generatedAlwaysAs(sql`(attributes->>'parentId')::VARCHAR(30)`)
          .stored()
      )
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('nodes_revision_sequence')`)
      )
      .addColumn('attributes', 'jsonb', (col) => col.notNull())
      .addColumn('state', 'bytea', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .execute();

    await db.schema
      .createIndex('nodes_root_id_revision_idx')
      .on('nodes')
      .columns(['root_id', 'revision'])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_node_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('nodes_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_node_revision
      BEFORE UPDATE ON nodes
      FOR EACH ROW
      EXECUTE FUNCTION update_node_revision();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_node_revision ON nodes;
      DROP FUNCTION IF EXISTS update_node_revision();
    `.execute(db);

    await db.schema.dropTable('nodes').execute();
  },
};
