import { sql, Migration } from 'kysely';

export const createNodeInteractionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS node_interactions_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('node_interactions')
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('node_interactions_revision_sequence')`)
      )
      .addColumn('first_seen_at', 'timestamptz')
      .addColumn('last_seen_at', 'timestamptz')
      .addColumn('first_opened_at', 'timestamptz')
      .addColumn('last_opened_at', 'timestamptz')
      .addPrimaryKeyConstraint('node_interactions_pkey', [
        'node_id',
        'collaborator_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_node_interaction_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('node_interactions_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_node_interaction_revision
      BEFORE UPDATE ON node_interactions
      FOR EACH ROW
      EXECUTE FUNCTION update_node_interaction_revision();
    `.execute(db);

    await db.schema
      .createIndex('node_interactions_root_id_revision_idx')
      .on('node_interactions')
      .columns(['root_id', 'revision'])
      .execute();
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_node_interaction_revision ON node_interactions;
      DROP FUNCTION IF EXISTS update_node_interaction_revision();
    `.execute(db);

    await db.schema.dropTable('node_interactions').execute();
    await sql`DROP SEQUENCE IF EXISTS node_interactions_revision_sequence`.execute(
      db
    );
  },
};
