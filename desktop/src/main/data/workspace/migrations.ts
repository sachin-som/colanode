import { Migration, sql } from 'kysely';

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('type', 'text', (col) =>
        col
          .notNull()
          .generatedAlwaysAs(sql`json_extract(attributes, '$.type')`)
          .stored(),
      )
      .addColumn('parent_id', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.parentId')`)
          .stored()
          .references('nodes.id')
          .onDelete('cascade'),
      )
      .addColumn('index', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.index')`)
          .stored(),
      )
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('state', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('server_version_id', 'text')
      .execute();

    await sql`
      CREATE INDEX IF NOT EXISTS "nodes_parent_id_type_index" ON "nodes" ("parent_id", "type");
    `.execute(db);
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createUserNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('user_nodes')
      .addColumn('user_id', 'text', (col) => col.notNull())
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id'),
      )
      .addColumn('last_seen_version_id', 'text')
      .addColumn('last_seen_at', 'text')
      .addColumn('mentions_count', 'integer', (col) =>
        col.notNull().defaultTo(0),
      )
      .addColumn('attributes', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addPrimaryKeyConstraint('user_nodes_pk', ['user_id', 'node_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('user_nodes').execute();
  },
};

const createChangesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('changes')
      .addColumn('id', 'integer', (col) => col.notNull().primaryKey())
      .addColumn('data', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('changes').execute();
  },
};

const createNodeNamesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE VIRTUAL TABLE node_names USING fts5(id UNINDEXED, name);

      CREATE TRIGGER node_insert_name
      AFTER INSERT ON nodes
      WHEN json_type(NEW.attributes, '$.name') = 'text'
      BEGIN
        INSERT INTO node_names (id, name)
        VALUES (
          NEW.id,
          json_extract(NEW.attributes, '$.name')
        );
      END;

      CREATE TRIGGER node_update_name
      AFTER UPDATE ON nodes
      WHEN json_extract(OLD.attributes, '$.name') IS NOT json_extract(NEW.attributes, '$.name')
      BEGIN
        DELETE FROM node_names WHERE id = OLD.id;

        INSERT INTO node_names (id, name)
        SELECT
          NEW.id,
          json_extract(NEW.attributes, '$.name')
        WHERE json_type(NEW.attributes, '$.name') = 'text';
      END;

      CREATE TRIGGER node_delete_name
      AFTER DELETE ON nodes
      BEGIN
        DELETE FROM node_names WHERE id = OLD.id;
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TABLE node_names;
      DROP TRIGGER IF EXISTS node_insert_name;
      DROP TRIGGER IF EXISTS node_update_name;
      DROP TRIGGER IF EXISTS node_delete_name;
    `.execute(db);
  },
};

const createUploadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('uploads')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().primaryKey().references('nodes.id'),
      )
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('progress', 'integer', (col) => col.defaultTo(0))
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('uploads').execute();
  },
};

const createDownloadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('downloads')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().primaryKey().references('nodes.id'),
      )
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('progress', 'integer', (col) => col.defaultTo(0))
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('downloads').execute();
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001_create_nodes_table': createNodesTable,
  '00002_create_user_nodes_table': createUserNodesTable,
  '00003_create_changes_table': createChangesTable,
  '00004_create_node_names_table': createNodeNamesTable,
  '00005_create_uploads_table': createUploadsTable,
  '00006_create_downloads_table': createDownloadsTable,
};
