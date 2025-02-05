import { sql, Migration } from 'kysely';

export const createCollaborationsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS collaborations_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('collaborations')
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('collaborations_revision_sequence')`)
      )
      .addColumn('role', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('deleted_at', 'timestamptz')
      .addColumn('deleted_by', 'varchar(30)')
      .addPrimaryKeyConstraint('collaborations_pkey', [
        'node_id',
        'collaborator_id',
      ])
      .execute();

    await db.schema
      .createIndex('collaborations_collaborator_revision_idx')
      .on('collaborations')
      .columns(['collaborator_id', 'revision'])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_collaboration_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('collaborations_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_collaboration_revision
      BEFORE UPDATE ON collaborations
      FOR EACH ROW
      EXECUTE FUNCTION update_collaboration_revision();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_collaboration_revision ON collaborations;
      DROP FUNCTION IF EXISTS update_collaboration_revision();
    `.execute(db);

    await db.schema.dropTable('collaborations').execute();
    await sql`DROP SEQUENCE IF EXISTS collaborations_revision_sequence`.execute(
      db
    );
  },
};
