import { sql, Migration } from 'kysely';

export const createNodeTombstonesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS node_tombstones_revision_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('node_tombstones')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('node_tombstones_revision_sequence')`)
      )
      .addColumn('deleted_at', 'timestamptz', (col) => col.notNull())
      .addColumn('deleted_by', 'varchar(30)', (col) => col.notNull())
      .execute();

    await db.schema
      .createIndex('node_tombstones_root_id_revision_idx')
      .on('node_tombstones')
      .columns(['root_id', 'revision'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropIndex('node_tombstones_root_id_revision_idx').execute();

    await db.schema.dropTable('node_tombstones').execute();
    await sql`DROP SEQUENCE IF EXISTS node_tombstones_revision_sequence`.execute(
      db
    );
  },
};
