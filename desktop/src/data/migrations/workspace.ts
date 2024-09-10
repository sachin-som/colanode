import { Migration, sql } from 'kysely';

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('parent_id', 'text', (col) =>
        col.references('nodes.id').onDelete('cascade'),
      )
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('index', 'text')
      .addColumn('content', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('server_version_id', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createNodesParentIdAndTypeIndex: Migration = {
  up: async (db) => {
    await sql`
      CREATE INDEX IF NOT EXISTS "nodes_parent_id_type_index" ON "nodes" ("parent_id", "type");
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP INDEX IF EXISTS "nodes_parent_id_type_index"`.execute(db);
  },
};

const createNodeAttributesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_attributes')
      .addColumn('node_id', 'text', (col) =>
        col.references('nodes.id').onDelete('cascade'),
      )
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('key', 'text', (col) => col.notNull())
      .addColumn('text_value', 'text')
      .addColumn('number_value', 'real')
      .addColumn('foreign_node_id', 'text', (col) =>
        col.references('nodes.id').onDelete('cascade'),
      )
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('server_version_id', 'text')
      .addPrimaryKeyConstraint('node_attributes_pkey', [
        'node_id',
        'type',
        'key',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_attributes').execute();
  },
};

const createMutationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('mutations')
      .addColumn('id', 'integer', (col) => col.notNull().primaryKey())
      .addColumn('table', 'text', (col) => col.notNull())
      .addColumn('action', 'text', (col) => col.notNull())
      .addColumn('before', 'text')
      .addColumn('after', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('mutations').execute();
  },
};

const createNodesInsertTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_insert_nodes
      AFTER INSERT ON nodes
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL
      BEGIN
          INSERT INTO mutations ('action', 'table', 'after', 'created_at')
          VALUES (
              'insert',
              'nodes',
              json_object(
                  'id', NEW.'id',
                  'parent_id', NEW.'parent_id',
                  'type', NEW.'type',
                  'index', NEW.'index',
                  'content', NEW.'content',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_insert_nodes`.execute(db);
  },
};

const createNodesUpdateTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_update_nodes
      AFTER UPDATE ON nodes
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL OR NEW.version_id != NEW.server_version_id
      BEGIN
          INSERT INTO mutations ('action', 'table', 'before', 'after', 'created_at')
          VALUES (
              'update',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'parent_id', OLD.'parent_id',
                  'type', OLD.'type',
                  'index', OLD.'index',
                  'content', OLD.'content',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              json_object(
                  'id', NEW.'id',
                  'parent_id', NEW.'parent_id',
                  'type', NEW.'type',
                  'index', NEW.'index',
                  'content', NEW.'content',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_update_nodes`.execute(db);
  },
};

const createDeleteNodesTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_delete_nodes
      AFTER DELETE ON nodes
      FOR EACH ROW
      BEGIN
          INSERT INTO mutations ('action', 'table', 'before', 'created_at')
          VALUES (
              'delete',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'parent_id', OLD.'parent_id',
                  'type', OLD.'type',
                  'index', OLD.'index',
                  'content', OLD.'content',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_delete_nodes`.execute(db);
  },
};

const createNodeAttributesInsertTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_insert_node_attributes
      AFTER INSERT ON node_attributes
      FOR EACH ROW
      BEGIN
          INSERT INTO mutations ('action', 'table', 'after', 'created_at')
          VALUES (
              'insert',
              'node_attributes',
              json_object(
                  'node_id', NEW.'node_id',
                  'type', NEW.'type',
                  'key', NEW.'key',
                  'text_value', NEW.'text_value',
                  'number_value', NEW.'number_value',
                  'foreign_node_id', NEW.'foreign_node_id',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_insert_node_attributes`.execute(db);
  },
};

const createNodeAttributesUpdateTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_update_node_attributes
      AFTER UPDATE ON node_attributes
      FOR EACH ROW
      BEGIN
          INSERT INTO mutations ('action', 'table', 'before', 'after', 'created_at')
          VALUES (
              'update',
              'node_attributes',
              json_object(
                  'node_id', OLD.'node_id',
                  'type', OLD.'type',
                  'key', OLD.'key',
                  'text_value', OLD.'text_value',
                  'number_value', OLD.'number_value',
                  'foreign_node_id', OLD.'foreign_node_id',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              json_object(
                  'node_id', NEW.'node_id',
                  'type', NEW.'type',
                  'key', NEW.'key',
                  'text_value', NEW.'text_value',
                  'number_value', NEW.'number_value',
                  'foreign_node_id', NEW.'foreign_node_id',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_update_node_attributes`.execute(db);
  },
};

const createNodeAttributesDeleteTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_delete_node_attributes
      AFTER DELETE ON node_attributes
      FOR EACH ROW
      BEGIN
          INSERT INTO mutations ('action', 'table', 'before', 'created_at')
          VALUES (
              'delete',
              'node_attributes',
              json_object(
                  'node_id', OLD.'node_id',
                  'type', OLD.'type',
                  'key', OLD.'key',
                  'text_value', OLD.'text_value',
                  'number_value', OLD.'number_value',
                  'foreign_node_id', OLD.'foreign_node_id',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_delete_node_attributes`.execute(db);
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001_create_nodes_table': createNodesTable,
  '00002_create_nodes_parent_id_and_type_index':
    createNodesParentIdAndTypeIndex,
  '00003_create_node_attributes_table': createNodeAttributesTable,
  '00004_create_mutations_table': createMutationsTable,
  '00005_create_node_insert_trigger': createNodesInsertTrigger,
  '00006_create_node_update_trigger': createNodesUpdateTrigger,
  '00007_create_node_delete_trigger': createDeleteNodesTrigger,
  '00008_create_node_attributes_insert_trigger':
    createNodeAttributesInsertTrigger,
  '00009_create_node_attributes_update_trigger':
    createNodeAttributesUpdateTrigger,
  '00010_create_node_attributes_delete_trigger':
    createNodeAttributesDeleteTrigger,
};
