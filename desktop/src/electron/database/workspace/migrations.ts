import {Migration} from "kysely";

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.notNull())
      .addColumn('workspace_id', 'text', (col) => col.notNull())
      .addColumn('parent_id', 'text')
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('attrs', 'text')
      .addColumn('content', 'text')
      .addColumn('created_at', 'timestamp', (col) => col.notNull())
      .addColumn('updated_at', 'timestamp')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .execute()
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute()
  }
}

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '202408011756_create_nodes_table': createNodesTable
}