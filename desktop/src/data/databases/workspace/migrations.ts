import { Migration } from 'kysely';

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
      .addColumn('state', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '202408011756_create_nodes_table': createNodesTable,
};
