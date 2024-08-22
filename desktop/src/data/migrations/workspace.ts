import { Migration, sql } from 'kysely';

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('workspace_id', 'text', (col) => col.notNull())
      .addColumn('parent_id', 'text', (col) =>
        col.references('nodes.id').onDelete('cascade'),
      )
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('index', 'text')
      .addColumn('attrs', 'text')
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

const createTransactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('transactions')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('action', 'text', (col) => col.notNull())
      .addColumn('table', 'text', (col) => col.notNull())
      .addColumn('after', 'json')
      .addColumn('before', 'json')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('transactions').execute();
  },
};

const createNodesInsertTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER after_insert_nodes
      AFTER INSERT ON nodes
      FOR EACH ROW
      WHEN NEW.server_version_id is null
      BEGIN
          INSERT INTO transactions ('id', 'action', 'table', 'after', 'created_at')
          VALUES (
              transaction_id(),
              'insert',
              'nodes',
              json_object(
                  'id', NEW.'id',
                  'workspace_id', NEW.'workspace_id',
                  'parent_id', NEW.'parent_id',
                  'type', NEW.'type',
                  'index', NEW.'index',
                  'attrs', NEW.'attrs',
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
      WHEN NEW.version_id != NEW.server_version_id
      BEGIN
          INSERT INTO transactions ('id', 'action', 'table', 'before', 'after', 'created_at')
          VALUES (
              transaction_id(),
              'update',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'workspace_id', OLD.'workspace_id',
                  'parent_id', OLD.'parent_id',
                  'type', OLD.'type',
                  'index', OLD.'index',
                  'attrs', OLD.'attrs',
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
                  'workspace_id', NEW.'workspace_id',
                  'parent_id', NEW.'parent_id',
                  'type', NEW.'type',
                  'index', NEW.'index',
                  'attrs', NEW.'attrs',
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
          INSERT INTO transactions ('id', 'action', 'table', 'before', 'created_at')
          VALUES (
              transaction_id(),
              'delete',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'workspace_id', OLD.'workspace_id',
                  'parent_id', OLD.'parent_id',
                  'type', OLD.'type',
                  'index', OLD.'index',
                  'attrs', OLD.'attrs',
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

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '202408011756_create_nodes_table': createNodesTable,
  '202408011757_create_transactions_table': createTransactionsTable,
  '202408011758_create_nodes_insert_trigger': createNodesInsertTrigger,
  '202408011759_create_nodes_update_trigger': createNodesUpdateTrigger,
  '202408011800_create_nodes_delete_trigger': createDeleteNodesTrigger,
};
