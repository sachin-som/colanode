import { sql, Migration } from 'kysely';

export const createNodeReactionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS node_reactions_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('node_reactions')
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('reaction', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('node_reactions_revision_sequence')`)
      )
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('deleted_at', 'timestamptz')
      .addPrimaryKeyConstraint('node_reactions_pkey', [
        'node_id',
        'collaborator_id',
        'reaction',
      ])
      .execute();

    await db.schema
      .createIndex('node_reactions_root_id_revision_idx')
      .on('node_reactions')
      .columns(['root_id', 'revision'])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_node_reaction_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('node_reactions_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_node_reaction_revision
      BEFORE UPDATE ON node_reactions
      FOR EACH ROW
      EXECUTE FUNCTION update_node_reaction_revision();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_node_reaction_revision ON node_reactions;
      DROP FUNCTION IF EXISTS update_node_reaction_revision();
    `.execute(db);

    await db.schema.dropTable('node_reactions').execute();
    await sql`DROP SEQUENCE IF EXISTS node_reactions_revision_sequence`.execute(
      db
    );
  },
};
